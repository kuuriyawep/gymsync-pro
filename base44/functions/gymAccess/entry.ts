import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createSupabaseRestClient } from '../../shared/supabaseRest.ts';
import { deny, hasPermission, resolveAccess } from '../../shared/authz.ts';

function phoneCandidates(input: string): string[] {
  const raw = String(input || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return [];

  const candidates = new Set<string>();
  const add = (value: string) => { if (value) candidates.add(value); };

  add(raw);
  add(digits);

  if (digits.startsWith("00")) add(digits.slice(2));

  if (digits.startsWith("252")) {
    const national = digits.slice(3);
    if (national) {
      add(national);
      add("0" + national);
      add("252" + national);
      add("+252" + national);
    }
  } else if (digits.startsWith("0") && digits.length >= 9) {
    const national = digits.slice(1);
    add(national);
    add("252" + national);
    add("+252" + national);
  } else if (digits.length === 9) {
    add("0" + digits);
    add("252" + digits);
    add("+252" + digits);
  }

  if (raw.startsWith("+")) add("+" + digits);
  return [...candidates];
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const operation = String(body.operation || '');
    const allowed = ['listStaff', 'inviteStaff', 'revokeStaff', 'join', 'memberData', 'createFeedback', 'listFeedback', 'updateFeedback', 'getGymProfile', 'updateGymProfile', 'updateNotificationSettings', 'listWorkspaceNotifications', 'markNotificationRead', 'markAllNotificationsRead', 'createOwnerGym', 'deleteAccount', 'resolveRole', 'sendMessage'];
    if (!allowed.includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });
    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const rest = createSupabaseRestClient(restUrl, serviceKey);
    const { request, select, insert, update } = rest;
    const supabaseAccessToken = String(body._supabaseAccessToken || '');
    const usingSupabaseIdentity = Boolean(supabaseAccessToken);
    const access = await resolveAccess(base44, rest, { url: restUrl, serviceKey, accessToken: supabaseAccessToken });
    const ownerEmail = access.email;

    const getGym = async () => access.gym;

    const loadMemberData = async () => {
      // access.member is already resolved by resolveAccess for either
      // identity path (Supabase user_id or legacy base44_user_id) — don't
      // re-query by a hardcoded column, or a Supabase-linked member is lost.
      const member = access.member;
      if (!member) return null;
      const gymFilter = encodeURIComponent(member.gym_id);
      const memberFilter = encodeURIComponent(member.id);
      const [gyms, memberships, plans, payments, attendance, notifications, feedback, messages] = await Promise.all([
        select('gyms', `id=eq.${gymFilter}&select=*&limit=1`),
        select('memberships', `member_id=eq.${memberFilter}&select=*&order=created_at.desc`),
        select('membership_plans', `gym_id=eq.${gymFilter}&select=*`),
        select('payments', `member_id=eq.${memberFilter}&select=*&order=paid_at.desc`),
        select('attendance', `member_id=eq.${memberFilter}&select=*&order=check_in_at.desc`),
        select('notifications', `member_id=eq.${memberFilter}&select=*&order=created_at.desc`),
        select('feedback_requests', `member_id=eq.${memberFilter}&select=*&order=created_at.desc`),
        select('member_messages', `member_id=eq.${memberFilter}&select=*&order=sent_at.desc&limit=20`)
      ]);
      const membership = memberships[0] || null;
      const plan = plans.find((item: any) => item.id === membership?.plan_id);
      let metadata: any = {};
      try { metadata = JSON.parse(member.notes || '{}'); } catch { metadata = {}; }
      const amountDue = Number(membership?.amount_due || plan?.price || 0);
      const amountPaid = Number(membership?.amount_paid || 0);
      const status = metadata.status || (member.status === 'active' ? 'Active' : member.status === 'suspended' ? 'Suspended' : 'Expired');
      const initials = String(member.full_name || '').split(' ').filter(Boolean).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();
      return {
        profile: { id: member.id, name: member.full_name, memberId: metadata.memberId || member.id.slice(0, 8).toUpperCase(), phone: member.phone, email: member.email || access.email || '', gym: gyms[0]?.name || '', joinDate: String(member.joined_at || member.created_at).slice(0, 10), avatar: initials, photoUrl: member.avatar_url || null, gender: metadata.gender || '' },
        membership: { plan: plan?.name || 'No plan', price: amountDue, startDate: membership?.start_date || '', expiryDate: membership?.end_date || '', status, autoRenew: Boolean(membership?.auto_renew) },
        balance: { price: amountDue, paid: amountPaid, balance: metadata.balance_override !== undefined && metadata.balance_override >= 0 ? metadata.balance_override : Math.max(0, amountDue - amountPaid), status: amountDue <= amountPaid ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Outstanding', renewalDate: membership?.end_date || '' },
        payments: payments.map((payment: any) => ({ id: payment.id, amount: Number(payment.amount || 0), date: String(payment.paid_at || payment.created_at).slice(0, 10), method: String(payment.method || '').replace(/_/g, ' '), status: 'Paid', reference: payment.reference || '' })),
        attendance: attendance.map((item: any) => ({ id: item.id, checkedInAt: item.check_in_at, date: String(item.check_in_at).slice(0, 10) })),
        notifications: notifications.map((item: any) => ({ id: item.id, title: item.title, description: item.message || '', read: Boolean(item.read_at), createdAt: item.created_at })),
        feedback: feedback.map((item: any) => ({ id: item.id, type: ({ feedback: 'Feedback', complaint: 'Complaint', feature_request: 'Feature Request', bug: 'Feature Request', coach_request: 'Coach Request', machine_request: 'Machine Request', other: 'Feedback' } as Record<string, string>)[item.type] || 'Feedback', title: item.subject || '', body: item.message || '', status: ({ open: 'Pending', in_progress: 'Under Review', resolved: 'Approved', closed: 'Completed' } as Record<string, string>)[item.status] || 'Pending', date: String(item.created_at).slice(0, 10), response: item.response || null })), 
        messages: messages.map((item: any) => ({ id: item.id, message: item.message, channel: item.channel || 'in_app', sentAt: item.sent_at || item.created_at }))
      };
    };

    if (operation === 'resolveRole') {
      return Response.json({
        roles: access.role ? [access.role] : [],
        role: access.role,
        permissions: access.permissions.filter((item) => item !== '*'),
        gymId: access.gym?.id || null
      });
    }

    if (operation === 'join') {
      if (access.role === 'owner' || access.role === 'staff') return deny('Only a member account can join a gym');

      const phone = String(body.phone || '').trim();
      const joinToken = String(body.joinToken || '').trim();
      if (!phone || !joinToken) {
        return Response.json({ error: 'Phone number and join code are required' }, { status: 400 });
      }

      // Phone numbers are a lookup hint, not the account-linking secret.
      // Accept common Somali formats and let the owner-issued join token
      // disambiguate duplicate phone records safely.
      const matches: any[] = [];
      for (const candidate of phoneCandidates(phone)) {
        const rows = await select(
          'members',
          `phone=eq.${encodeURIComponent(candidate)}&select=*&limit=20`
        );
        for (const row of rows) {
          if (!matches.some((item: any) => item.id === row.id)) matches.push(row);
        }
      }

      if (!matches.length) {
        return Response.json({ error: 'Member details did not match' }, { status: 404 });
      }

      const tokenMatches = matches.filter((row: any) => {
        try {
          const metadata = JSON.parse(row.notes || '{}');
          return metadata?.joinToken === joinToken;
        } catch {
          return false;
        }
      });

      if (!tokenMatches.length) {
        return Response.json({ error: 'Invalid join code' }, { status: 403 });
      }

      if (tokenMatches.length > 1) {
        return Response.json({ error: 'Multiple members match this phone and join code' }, { status: 409 });
      }

      const member = tokenMatches[0];

      if (access.member && access.member.id !== member.id) {
        return Response.json({ error: 'This account is already linked to a member' }, { status: 409 });
      }

      // Supabase Auth is the canonical identity. Legacy Base44 callers keep
      // their old field so the migration remains backward compatible.
      if (usingSupabaseIdentity) {
        if (member.user_id && member.user_id !== access.userId) {
          return Response.json({ error: 'This member is already linked to another account' }, { status: 409 });
        }

        if (member.base44_user_id && member.base44_user_id !== access.userId && !member.user_id) {
          return Response.json({ error: 'This member is already linked to another account' }, { status: 409 });
        }

        await update(
          'members',
          `id=eq.${encodeURIComponent(member.id)}&user_id=is.null`,
          { user_id: access.userId, email: ownerEmail }
        );
      } else {
        if (member.base44_user_id && member.base44_user_id !== access.userId) {
          return Response.json({ error: 'This member is already linked to another account' }, { status: 409 });
        }

        await update(
          'members',
          `id=eq.${encodeURIComponent(member.id)}&base44_user_id=is.null`,
          { base44_user_id: access.userId, email: ownerEmail }
        );
      }

      // Keep the profile/gym relationship in sync for the member portal.
      if (usingSupabaseIdentity && access.userId && member.gym_id) {
        await request('profiles?on_conflict=id', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            id: access.userId,
            role: 'member',
            gym_id: member.gym_id,
            full_name: member.full_name,
            email: ownerEmail,
          }),
        });
      }

      return Response.json({ success: true, member: await loadMemberData() });
    }

    if (operation === 'memberData') {
      const memberData = await loadMemberData();
      if (!memberData) return Response.json({ error: 'No linked membership found' }, { status: 404 });
      return Response.json({ member: memberData });
    }

    if (operation === 'createFeedback') {
      const memberData = await loadMemberData();
      if (!memberData) return Response.json({ error: 'No linked membership found' }, { status: 404 });
      const input = body.feedback || {};
      if (!input.title?.trim() || !input.body?.trim()) return Response.json({ error: 'Title and details are required' }, { status: 400 });
      const typeMap: Record<string, string> = { Feedback: 'feedback', Complaint: 'complaint', 'Feature Request': 'feature_request', 'Machine Request': 'machine_request', 'Coach Request': 'coach_request' };
      await insert('feedback_requests', { gym_id: access.member.gym_id, member_id: access.member.id, user_id: access.userId, channel: 'gym', type: typeMap[String(input.type || 'Feedback').trim()] || 'feedback', subject: input.title.trim(), message: input.body.trim(), status: 'open', priority: 'normal' }, 'return=minimal');
      // The submission is complete once PostgREST accepts the INSERT. Do not
      // request/parse a returned row or reload the portal here; either can turn
      // a successful write into a misleading 500 response.
      return Response.json({ success: true });
    }

    if (operation === 'listFeedback') {
      if (access.role !== 'owner' && access.role !== 'staff') return deny();
      if (!access.gym?.id) return Response.json({ error: 'No gym is linked to this owner/staff account' }, { status: 403 });
      const rows = await select('feedback_requests', `gym_id=eq.${encodeURIComponent(access.gym.id)}&select=id,member_id,type,subject,message,status,response,created_at,updated_at&order=created_at.desc`);
      const memberIds = [...new Set(rows.map((item: any) => item.member_id).filter(Boolean))];
      const memberRows = await Promise.all(memberIds.map((memberId: string) =>
        select('members', `id=eq.${encodeURIComponent(memberId)}&select=id,full_name,phone,email&limit=1`)
      ));
      const memberMap = new Map(memberRows.map((result: any[]) => {
        const member = result[0] || {};
        return [member.id, member];
      }));
      const statusMap: Record<string, string> = { open: 'Pending', in_progress: 'Under Review', resolved: 'Approved', closed: 'Completed' };
      const typeMap: Record<string, string> = { feedback: 'Feedback', complaint: 'Complaint', feature_request: 'Feature Request', bug: 'Feature Request', coach_request: 'Coach Request', machine_request: 'Machine Request', other: 'Feedback' };
      return Response.json({ feedback: rows.map((item: any) => {
        const member = memberMap.get(item.member_id) || {};
        return { id: item.id, type: typeMap[item.type] || 'Feedback', title: item.subject || '', body: item.message || '', status: statusMap[item.status] || 'Pending', date: String(item.created_at).slice(0, 10), response: item.response || null, member: { id: item.member_id, name: member.full_name || 'Member', phone: member.phone || '', email: member.email || '' } };
      }) });
    }

    if (operation === 'updateFeedback') {
      if (access.role !== 'owner' && access.role !== 'staff') return deny();
      const id = String(body.id || '').trim();
      const responseText = String(body.response || '').trim();
      const statusInput = String(body.status || '').trim();
      if (!id) return Response.json({ error: 'Feedback item is required' }, { status: 400 });
      const statusMap: Record<string, string> = { Pending: 'open', 'Under Review': 'in_progress', Approved: 'resolved', Rejected: 'closed', Completed: 'closed' };
      const values: Record<string, any> = { updated_at: new Date().toISOString() };
      if (statusInput && statusMap[statusInput]) values.status = statusMap[statusInput];
      if (responseText) { values.response = responseText.slice(0, 2000); values.responded_by = access.userId; values.responded_at = new Date().toISOString(); }
      const rows = await select('feedback_requests', `id=eq.${encodeURIComponent(id)}&gym_id=eq.${encodeURIComponent(access.gym.id)}&select=id,member_id,subject,message,status,response&limit=1`);
      if (!rows[0]) return Response.json({ error: 'Feedback not found' }, { status: 404 });
      const updated = (await update('feedback_requests', `id=eq.${encodeURIComponent(id)}&gym_id=eq.${encodeURIComponent(access.gym.id)}`, values))[0];
      if (responseText && updated?.member_id) {
        const memberRows = await select('members', `id=eq.${encodeURIComponent(updated.member_id)}&select=user_id&limit=1`);
        const memberUserId = memberRows[0]?.user_id || null;
        await insert('notifications', {
          member_id: updated.member_id,
          user_id: memberUserId,
          gym_id: access.gym.id,
          type: 'feedback_response',
          title: 'Gym responded to your feedback',
          message: responseText.slice(0, 500),
        });
      }
      return Response.json({ success: true });
    }

    if (operation === 'createOwnerGym') {
      const input = body.gym || {};
      const name = String(input.name || '').trim();
      const location = String(input.location || '').trim();
      if (!name) return Response.json({ error: 'Gym name is required' }, { status: 400 });
      // Check if a gym already exists for this owner's email (idempotent for existing owners)
      const existing = await getGym();
      if (existing) return Response.json({ gymId: existing.id, gym: { id: existing.id, name: existing.name || '', phone: existing.phone || '', email: existing.email || '', address: existing.address || '', logoUrl: existing.logo_url || null }, existed: true });
      // Block users who already have a business association (staff or member) from
      // creating a second owner gym. Only users with NO association may onboard.
      const [staffRows, memberRows] = await Promise.all([
        select('staff', `base44_user_id=eq.${encodeURIComponent(access.userId)}&select=id&limit=1`),
        select('members', `base44_user_id=eq.${encodeURIComponent(access.userId)}&select=id&limit=1`)
      ]);
      if (staffRows[0] || memberRows[0]) return Response.json({ error: 'You already have an account associated with a gym and cannot create a second one' }, { status: 403 });
      const created = (await insert('gyms?return=representation', {
        name: name.slice(0, 120),
        address: location ? location.slice(0, 240) : null,
        logo_url: input.logoUrl ? String(input.logoUrl).slice(0, 1000) : null,
        email: ownerEmail.slice(0, 160),
        owner_base44_user_id: access.userId
      }))[0];
      const defaultPrice = Number(created.membership_default_price ?? 15);
      await insert('membership_plans?return=representation', { gym_id: created.id, name: 'Monthly', duration_months: 1, price: Number.isFinite(defaultPrice) && defaultPrice >= 0 ? defaultPrice : 15, is_active: true });
      return Response.json({ gymId: created.id, gym: { id: created.id, name: created.name || '', phone: created.phone || '', email: created.email || '', address: created.address || '', logoUrl: created.logo_url || null }, existed: false });
    }

    let gym = await getGym();
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });

    const ownerOnly = new Set(['listStaff', 'inviteStaff', 'revokeStaff', 'updateGymProfile', 'deleteAccount']);
    if (ownerOnly.has(operation) && access.role !== 'owner') return deny();
    if (operation === 'getGymProfile' && !hasPermission(access, 'gym.read')) return deny();
    if (operation === 'sendMessage' && !hasPermission(access, 'members.write')) return deny();
    const gymProfile = (row: any) => ({
      id: row.id,
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      logoUrl: row.logo_url || null,
      notifications: {
        expiry: Boolean(row.settings?.notifications?.expiry ?? true),
        payments: Boolean(row.settings?.notifications?.payments ?? true),
        newMembers: Boolean(row.settings?.notifications?.newMembers ?? true),
      },
    });

    if (operation === 'getGymProfile') return Response.json({ gym: gymProfile(gym) });

    if (operation === 'listWorkspaceNotifications') {
      if (access.role !== 'owner' && access.role !== 'staff') return deny();
      const targetUserId = access.role === 'owner' ? access.userId : gym.owner_id;
      if (!targetUserId) return Response.json({ notifications: [] });
      const rows = await select(
        'notifications',
        `gym_id=eq.${encodeURIComponent(gym.id)}&user_id=eq.${encodeURIComponent(targetUserId)}&select=*&order=created_at.desc&limit=50`
      );
      return Response.json({
        notifications: rows.map((item: any) => ({
          id: item.id,
          type: item.type || 'general',
          title: item.title || 'Notification',
          description: item.message || '',
          read: Boolean(item.read_at),
          occurredAt: item.created_at,
        })),
      });
    }

    if (operation === 'markNotificationRead') {
      if (access.role !== 'owner' && access.role !== 'staff') return deny();
      const targetUserId = access.role === 'owner' ? access.userId : gym.owner_id;
      const id = String(body.id || '').trim();
      if (!id || !targetUserId) return Response.json({ error: 'Notification is required' }, { status: 400 });
      await update(
        'notifications',
        `id=eq.${encodeURIComponent(id)}&gym_id=eq.${encodeURIComponent(gym.id)}&user_id=eq.${encodeURIComponent(targetUserId)}`,
        { read_at: new Date().toISOString() }
      );
      return Response.json({ success: true });
    }

    if (operation === 'markAllNotificationsRead') {
      if (access.role !== 'owner' && access.role !== 'staff') return deny();
      const targetUserId = access.role === 'owner' ? access.userId : gym.owner_id;
      if (!targetUserId) return Response.json({ success: true });
      await update(
        'notifications',
        `gym_id=eq.${encodeURIComponent(gym.id)}&user_id=eq.${encodeURIComponent(targetUserId)}&read_at=is.null`,
        { read_at: new Date().toISOString() }
      );
      return Response.json({ success: true });
    }

    if (operation === 'updateNotificationSettings') {
      if (access.role !== 'owner') return deny();
      const input = body.notifications || {};
      const notifications = {
        expiry: Boolean(input.expiry),
        payments: Boolean(input.payments),
        newMembers: Boolean(input.newMembers),
      };
      const settings = {
        ...(gym.settings || {}),
        notifications: {
          ...(gym.settings?.notifications || {}),
          ...notifications,
        },
      };
      gym = (await update('gyms', `id=eq.${encodeURIComponent(gym.id)}`, { settings }))[0] || gym;
      return Response.json({ notifications: gymProfile(gym).notifications });
    }

    if (operation === 'sendMessage') {
      const memberId = String(body.memberId || '').trim();
      const message = String(body.message || '').trim();
      if (!memberId || !message) return Response.json({ error: 'Member and message are required' }, { status: 400 });
      if (message.length > 1000) return Response.json({ error: 'Message is too long' }, { status: 400 });
      const owned = await select('members', `id=eq.${encodeURIComponent(memberId)}&gym_id=eq.${encodeURIComponent(gym.id)}&select=id&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      const senderId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(access.userId)) ? access.userId : null;
      const row = (await insert('member_messages', { gym_id: gym.id, member_id: memberId, sender_id: senderId, message, channel: 'in_app' }))[0];
      return Response.json({ success: true, message: { id: row.id, message: row.message, channel: row.channel, sentAt: row.sent_at || row.created_at } });
    }

    if (operation === 'updateGymProfile') {
      const input = body.gym || {};
      const name = String(input.name || '').trim();
      if (!name) return Response.json({ error: 'Gym name is required' }, { status: 400 });
      const values = {
        name: name.slice(0, 120),
        phone: String(input.phone || '').trim().slice(0, 40) || null,
        email: String(input.email || '').trim().toLowerCase().slice(0, 160) || null,
        address: String(input.address || '').trim().slice(0, 240) || null,
        logo_url: input.logoUrl ? String(input.logoUrl).slice(0, 1000) : null
      };
      gym = (await update('gyms', `id=eq.${encodeURIComponent(gym.id)}`, values))[0];
      return Response.json({ gym: gymProfile(gym) });
    }

    if (operation === 'deleteAccount') {
      // Delete all gym-related data: staff, membership plans, members (and their
      // related records), then the gym record itself.
      const gymId = encodeURIComponent(gym.id);
      // 1. Find all members for this gym so we can cascade their related data
      const gymMembers = await select('members', `gym_id=eq.${gymId}&select=id`);
      const memberIds = gymMembers.map((m: any) => encodeURIComponent(m.id)).join(',');
      if (memberIds) {
        const memberFilter = `member_id=in.(${memberIds})`;
        await request(`memberships?${memberFilter}`, { method: 'DELETE' });
        await request(`payments?${memberFilter}`, { method: 'DELETE' });
        await request(`attendance?${memberFilter}`, { method: 'DELETE' });
        await request(`notifications?${memberFilter}`, { method: 'DELETE' });
        await request(`feedback_requests?${memberFilter}`, { method: 'DELETE' });
      }
      // 2. Delete staff, membership plans, members, and the gym itself
      await request(`staff?gym_id=eq.${gymId}`, { method: 'DELETE' });
      await request(`membership_plans?gym_id=eq.${gymId}`, { method: 'DELETE' });
      await request(`members?gym_id=eq.${gymId}`, { method: 'DELETE' });
      await request(`gyms?id=eq.${gymId}`, { method: 'DELETE' });
      return Response.json({ success: true });
    }

    if (operation === 'inviteStaff') {
      const email = String(body.email || '').trim().toLowerCase();
      const fullName = String(body.full_name || '').trim();
      const role = String(body.role || 'Front Desk');
      if (!fullName) return Response.json({ error: 'Full name is required' }, { status: 400 });
      if (!email || !['Manager', 'Front Desk', 'Cashier'].includes(role)) return Response.json({ error: 'Valid email and role are required' }, { status: 400 });
      // Map UI role names to DB role values (lowercase with underscores)
      const roleMap: Record<string, string> = { 'Manager': 'manager', 'Front Desk': 'front_desk', 'Cashier': 'cashier' };
      const dbRole = roleMap[role] || 'front_desk';
      // Insert staff record — full_name comes from owner input, NOT derived from email
      await insert('staff', { gym_id: gym.id, full_name: fullName, email, role: dbRole, status: 'invited' });
    }
    if (operation === 'revokeStaff') {
      await request(`staff?id=eq.${encodeURIComponent(String(body.id || ''))}&gym_id=eq.${encodeURIComponent(gym.id)}`, { method: 'DELETE' });
    }
    const rows = await select('staff', `gym_id=eq.${encodeURIComponent(gym.id)}&select=*&order=created_at.desc`);
    // Map DB role values back to UI role names
    const roleLabelMap: Record<string, string> = { 'manager': 'Manager', 'front_desk': 'Front Desk', 'cashier': 'Cashier' };
    const staff = rows.map((item: any) => {
      const staffEmail = String(item.email || '');
      const name = String(item.full_name || (staffEmail ? staffEmail.split('@')[0] : '') || 'Staff member');
      const statusMap: Record<string, string> = { 'invited': 'Invited', 'active': 'Active', 'revoked': 'Revoked' };
      return { id: item.id, name, email: staffEmail, role: roleLabelMap[item.role] || item.role || 'Staff', status: statusMap[item.status] || item.status || 'Invited', lastActive: item.joined_at ? new Date(item.joined_at).toLocaleDateString() : 'Never' };
    });
    return Response.json({ staff });
  } catch (error) {
    // Do not forward raw database/Supabase error messages to the client — they can
    // leak internal schema details. Naming the failed operation (not the raw
    // error) still gives useful signal without that risk.
    return Response.json({ error: `Unable to complete ${operation || 'request'}` }, { status: 500 });
  }
}