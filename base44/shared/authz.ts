import { createSupabaseRestClient } from './supabaseRest.ts';

export type Access = {
  userId: string;
  email: string;
  role: 'owner' | 'staff' | 'member' | null;
  gym: any | null;
  staff: any | null;
  member: any | null;
  permissions: string[];
};

const rolePermissions: Record<string, string[]> = {
  manager: ['members.read', 'members.write', 'payments.read', 'payments.write', 'plans.read', 'plans.write', 'reports.read'],
  front_desk: ['members.read', 'members.write', 'payments.write'],
  cashier: ['payments.read', 'payments.write'],
};

function permissionList(staff: any): string[] {
  const configured = staff?.permissions && typeof staff.permissions === 'object' ? staff.permissions : {};
  const values = Object.entries(configured).flatMap(([key, value]: [string, any]) => {
    if (value === true) return [key];
    if (Array.isArray(value)) return value.filter((item) => typeof item === 'string');
    return [];
  });
  return values.length ? values : (rolePermissions[String(staff?.role || '')] || []);
}

export function hasPermission(access: Access, permission: string): boolean {
  return access.role === 'owner' || access.permissions.includes(permission);
}

export type SupabaseAuthContext = { url: string; serviceKey: string; accessToken?: string };

// Verifies a Supabase access token against Supabase's own auth server. No JWT
// secret is handled here — GoTrue does the signature/expiry check for us and
// simply returns the identity, or a 4xx if the token is missing/invalid/expired.
async function resolveSupabaseIdentity(ctx: SupabaseAuthContext): Promise<{ id: string; email: string } | null> {
  if (!ctx.accessToken) return null;
  try {
    // ctx.url is the REST-API-rooted URL (already ends in /rest/v1, per how
    // select/insert/update use it in supabaseRest.ts) — the Auth API lives
    // at the project root, not under /rest/v1, so strip that suffix first.
    const authRoot = ctx.url.replace(/\/rest\/v1\/?$/, '');
    const res = await fetch(`${authRoot}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${ctx.accessToken}`, apikey: ctx.serviceKey },
    });
    if (!res.ok) return null;
    const user: any = await res.json();
    if (!user?.id) return null;
    return { id: String(user.id), email: String(user.email || '').trim().toLowerCase() };
  } catch {
    return null;
  }
}

export async function resolveAccess(base44: any, rest: ReturnType<typeof createSupabaseRestClient>, supabaseAuth?: SupabaseAuthContext): Promise<Access> {
  const { request, select, update } = rest;

  // Canonical identity is now Supabase Auth (gyms.owner_id / staff.user_id /
  // members.user_id). This is tried first whenever the caller supplies a
  // Supabase access token.
  const supabaseIdentity = supabaseAuth ? await resolveSupabaseIdentity(supabaseAuth) : null;
  if (supabaseIdentity) {
    const { id: userId, email } = supabaseIdentity;

    const gyms = await select('gyms', `owner_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`);
    const gym = gyms[0] || null;
    if (gym) return { userId, email, role: 'owner', gym, staff: null, member: null, permissions: ['*'] };

    // Staff invitations are bound to the Supabase user id as soon as the
    // owner sends the invitation. Accepting the email link therefore works
    // on any device/browser and never depends on a client-local invite token.
    let staffRows = await select('staff', `user_id=eq.${encodeURIComponent(userId)}&status=in.(active,invited)&select=*&limit=1`);
    let staff = staffRows[0] || null;
    if (!staff && email) {
      // Backward compatibility for invitations created before user_id was
      // stored on the staff row. Claim only an unbound invitation for the
      // authenticated email.
      staffRows = await select('staff', `email=eq.${encodeURIComponent(email)}&status=eq.invited&user_id=is.null&select=*&limit=1`);
      if (staffRows[0]) {
        staff = (await update(
          'staff',
          `id=eq.${encodeURIComponent(staffRows[0].id)}&status=eq.invited&user_id=is.null`,
          { user_id: userId, status: 'active', joined_at: new Date().toISOString() }
        ))[0] || staffRows[0];
      }
    }
    if (staff) {
      if (String(staff.status || '').toLowerCase() === 'invited') {
        staff = (await update(
          'staff',
          `id=eq.${encodeURIComponent(staff.id)}&user_id=eq.${encodeURIComponent(userId)}&status=eq.invited`,
          { status: 'active', joined_at: staff.joined_at || new Date().toISOString() }
        ))[0] || { ...staff, status: 'active' };
      }
      const gymRows = await select('gyms', `id=eq.${encodeURIComponent(staff.gym_id)}&select=*&limit=1`);
      const gym = gymRows[0] || null;
      if (gym) {
        // Keep profiles in sync so frontend role guards work on first login
        // and on later devices without relying on an old profile row.
        try {
          await request('profiles?on_conflict=id', {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify({
              id: userId,
              role: 'staff',
              gym_id: staff.gym_id,
              full_name: staff.full_name || email.split('@')[0],
              email,
              staff_role: staff.role || null,
            }),
          });
        } catch {
          // Authorization is still based on the staff row; profile sync is
          // best-effort and must not block a valid invited staff login.
        }
      }
      return { userId, email, role: 'staff', gym, staff, member: null, permissions: permissionList(staff) };
    }

    const memberRows = await select('members', `user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`);
    const member = memberRows[0] || null;
    if (member) {
      const gymRows = await select('gyms', `id=eq.${encodeURIComponent(member.gym_id)}&select=*&limit=1`);
      return { userId, email, role: 'member', gym: gymRows[0] || null, staff: null, member, permissions: ['member.portal'] };
    }

    return { userId, email, role: null, gym: null, staff: null, member: null, permissions: [] };
  }

  // Legacy path: kept only for any caller still carrying a Base44 session
  // (pre-migration staff, until Phase 2's staff auth ships). Unchanged from
  // before — same lookups, same one-time email-linking fallback.
  const user: any = await base44.auth.me();
  if (!user?.id) throw new Error('Unauthorized');
  const userId = String(user.id);
  const email = String(user.email || '').trim().toLowerCase();

  let gyms = await select('gyms', `owner_base44_user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`);
  let gym = gyms[0] || null;
  if (!gym && email) {
    gyms = await select('gyms', `owner_base44_user_id=is.null&email=eq.${encodeURIComponent(email)}&select=*&limit=1`);
    if (gyms[0]) {
      gym = (await update('gyms', `id=eq.${encodeURIComponent(gyms[0].id)}&owner_base44_user_id=is.null`, { owner_base44_user_id: userId }))[0] || gyms[0];
    }
  }
  if (gym) return { userId, email, role: 'owner', gym, staff: null, member: null, permissions: ['*'] };

  let staffRows = await select('staff', `base44_user_id=eq.${encodeURIComponent(userId)}&status=eq.active&select=*&limit=1`);
  let staff = staffRows[0] || null;
  if (!staff && email) {
    staffRows = await select('staff', `base44_user_id=is.null&email=eq.${encodeURIComponent(email)}&status=eq.invited&select=*&limit=1`);
    if (staffRows[0]) {
      staff = (await update('staff', `id=eq.${encodeURIComponent(staffRows[0].id)}&base44_user_id=is.null&status=eq.invited`, { base44_user_id: userId, status: 'active', joined_at: new Date().toISOString() }))[0] || staffRows[0];
    }
  }
  if (staff) {
    const gymRows = await select('gyms', `id=eq.${encodeURIComponent(staff.gym_id)}&select=*&limit=1`);
    return { userId, email, role: 'staff', gym: gymRows[0] || null, staff, member: null, permissions: permissionList(staff) };
  }

  let memberRows = await select('members', `base44_user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`);
  let member = memberRows[0] || null;
  if (!member && email) {
    memberRows = await select('members', `base44_user_id=is.null&email=eq.${encodeURIComponent(email)}&select=*&limit=1`);
    if (memberRows[0]) {
      member = (await update('members', `id=eq.${encodeURIComponent(memberRows[0].id)}&base44_user_id=is.null`, { base44_user_id: userId }))[0] || memberRows[0];
    }
  }
  if (member) {
    const gymRows = await select('gyms', `id=eq.${encodeURIComponent(member.gym_id)}&select=*&limit=1`);
    return { userId, email, role: 'member', gym: gymRows[0] || null, staff: null, member, permissions: ['member.portal'] };
  }

  return { userId, email, role: null, gym: null, staff: null, member: null, permissions: [] };
}

export function deny(message = 'You do not have permission to perform this action'): Response {
  return Response.json({ error: message }, { status: 403 });
}