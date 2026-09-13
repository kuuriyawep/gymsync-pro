import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createSupabaseRestClient } from '../../shared/supabaseRest.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const operation = String(body.operation || '');
    const allowed = ['listStaff', 'inviteStaff', 'revokeStaff', 'join', 'memberData', 'createFeedback', 'getGymProfile', 'updateGymProfile', 'createOwnerGym', 'deleteAccount', 'resolveRole'];
    if (!allowed.includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });
    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const { headers, request, select, insert, update } = createSupabaseRestClient(restUrl, serviceKey);
    // All auth is handled by Base44 — identify the caller via base44.auth.me()
    const user: any = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerEmail = String(user.email || '').toLowerCase();

    const getGym = async () => {
      const gyms = await select('gyms', `email=eq.${encodeURIComponent(ownerEmail)}&select=*&limit=1`);
      return gyms[0] || null;
    };

    const findLinkedMembers = async () => select('members', `email=eq.${encodeURIComponent(ownerEmail)}&select=*&limit=1`);

    const loadMemberData = async () => {
      const memberRows = await findLinkedMembers();
      const member = memberRows[0];
      if (!member) return null;
      const gymFilter = encodeURIComponent(member.gym_id);
      const memberFilter = encodeURIComponent(member.id);
      const [gyms, memberships, plans, payments, attendance, notifications, feedback] = await Promise.all([
        select('gyms', `id=eq.${gymFilter}&select=*&limit=1`),
        select('memberships', `member_id=eq.${memberFilter}&select=*&order=created_at.desc`),
        select('membership_plans', `gym_id=eq.${gymFilter}&select=*`),
        select('payments', `member_id=eq.${memberFilter}&select=*&order=paid_at.desc`),
        select('attendance', `member_id=eq.${memberFilter}&select=*&order=check_in_at.desc`),
        select('notifications', `member_id=eq.${memberFilter}&select=*&order=created_at.desc`),
        select('feedback_requests', `member_id=eq.${memberFilter}&select=*&order=created_at.desc`)
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
        profile: { id: member.id, name: member.full_name, memberId: metadata.memberId || member.id.slice(0, 8).toUpperCase(), phone: member.phone, email: member.email || user.email || '', gym: gyms[0]?.name || '', joinDate: String(member.joined_at || member.created_at).slice(0, 10), avatar: initials, photoUrl: member.avatar_url || null, gender: metadata.gender || '' },
        membership: { plan: plan?.name || 'No plan', price: amountDue, startDate: membership?.start_date || '', expiryDate: membership?.end_date || '', status, autoRenew: Boolean(membership?.auto_renew) },
        balance: { price: amountDue, paid: amountPaid, balance: metadata.balance_override !== undefined && metadata.balance_override >= 0 ? metadata.balance_override : Math.max(0, amountDue - amountPaid), status: amountDue <= amountPaid ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Outstanding', renewalDate: membership?.end_date || '' },
        payments: payments.map((payment: any) => ({ id: payment.id, amount: Number(payment.amount || 0), date: String(payment.paid_at || payment.created_at).slice(0, 10), method: String(payment.method || '').replace(/_/g, ' '), status: 'Paid', reference: payment.reference || '' })),
        attendance: attendance.map((item: any) => ({ id: item.id, checkedInAt: item.check_in_at, date: String(item.check_in_at).slice(0, 10) })),
        notifications: notifications.map((item: any) => ({ id: item.id, title: item.title, description: item.body || '', read: Boolean(item.read), createdAt: item.created_at })),
        feedback: feedback.map((item: any) => ({ id: item.id, type: item.type, title: item.title, body: item.body || '', status: item.status, date: String(item.created_at).slice(0, 10), response: item.response || null }))
      };
    };

    if (operation === 'resolveRole') {
      const [gyms, staffRows, memberRows] = await Promise.all([
        select('gyms', `email=eq.${encodeURIComponent(ownerEmail)}&select=id&limit=1`),
        select('staff', `email=eq.${encodeURIComponent(ownerEmail)}&select=id,role&limit=1`),
        select('members', `email=eq.${encodeURIComponent(ownerEmail)}&select=id&limit=1`)
      ]);
      const roles: string[] = [];
      if (gyms[0]) roles.push('owner');
      if (staffRows[0]) roles.push('staff');
      if (memberRows[0]) roles.push('member');
      return Response.json({ roles, role: roles[0] || null });
    }

    if (operation === 'join') {
      const phone = String(body.phone || '').trim();
      const fullName = String(body.fullName || '').trim();
      if (!phone || !fullName) return Response.json({ error: 'Phone and full name are required' }, { status: 400 });
      const matches = await select('members', `phone=eq.${encodeURIComponent(phone)}&full_name=ilike.${encodeURIComponent(fullName)}&select=*&limit=2`);
      if (matches.length !== 1) return Response.json({ error: 'Member details did not match exactly' }, { status: 404 });
      const member = matches[0];
      // Link the member to this Base44 user by email
      await update('members', `id=eq.${encodeURIComponent(member.id)}`, { email: ownerEmail });
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
      const memberRows = await findLinkedMembers();
      const input = body.feedback || {};
      if (!input.title?.trim() || !input.body?.trim()) return Response.json({ error: 'Title and details are required' }, { status: 400 });
      await insert('feedback_requests', { gym_id: memberRows[0].gym_id, member_id: memberRows[0].id, type: input.type, title: input.title.trim(), body: input.body.trim(), status: 'Pending' });
      return Response.json({ member: await loadMemberData() });
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
        select('staff', `email=eq.${encodeURIComponent(ownerEmail)}&select=id&limit=1`),
        select('members', `email=eq.${encodeURIComponent(ownerEmail)}&select=id&limit=1`)
      ]);
      if (staffRows[0] || memberRows[0]) return Response.json({ error: 'You already have an account associated with a gym and cannot create a second one' }, { status: 403 });
      const created = (await insert('gyms?return=representation', {
        name: name.slice(0, 120),
        address: location ? location.slice(0, 240) : null,
        logo_url: input.logoUrl ? String(input.logoUrl).slice(0, 1000) : null,
        email: ownerEmail.slice(0, 160)
      }))[0];
      await insert('membership_plans?return=representation', { gym_id: created.id, name: 'Monthly', duration_months: 1, price: 0, status: 'Active' });
      return Response.json({ gymId: created.id, gym: { id: created.id, name: created.name || '', phone: created.phone || '', email: created.email || '', address: created.address || '', logoUrl: created.logo_url || null }, existed: false });
    }

    let gym = await getGym();
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });
    const gymProfile = (row: any) => ({
      id: row.id,
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || '',
      logoUrl: row.logo_url || null
    });

    if (operation === 'getGymProfile') return Response.json({ gym: gymProfile(gym) });

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
    return Response.json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 500 });
  }
}