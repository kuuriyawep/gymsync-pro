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

export async function resolveAccess(base44: any, rest: ReturnType<typeof createSupabaseRestClient>): Promise<Access> {
  const user: any = await base44.auth.me();
  if (!user?.id) throw new Error('Unauthorized');
  const userId = String(user.id);
  const email = String(user.email || '').trim().toLowerCase();
  const { select, update } = rest;

  // Canonical identity: Base44 user ID. Email is used only as a one-time legacy
  // migration path for rows that have no Base44 ID yet, then immediately linked.
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
    staffRows = await select('staff', `base44_user_id=is.null&email=eq.${encodeURIComponent(email)}&status=eq.active&select=*&limit=1`);
    if (staffRows[0]) {
      staff = (await update('staff', `id=eq.${encodeURIComponent(staffRows[0].id)}&base44_user_id=is.null`, { base44_user_id: userId }))[0] || staffRows[0];
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
