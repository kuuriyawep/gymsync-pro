import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createSupabaseRestClient } from '../../shared/supabaseRest.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const operation = String(body.operation || '');
    const allowed = ['listStaff', 'inviteStaff', 'revokeStaff', 'join', 'memberData', 'createFeedback'];
    if (!allowed.includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });
    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const origin = new URL(restUrl).origin;
    const { headers, request, select, insert, update } = createSupabaseRestClient(restUrl, serviceKey);
    let user: any = null;
    let supabaseUser = false;
    if (body.accessToken) {
      const response = await fetch(`${origin}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${body.accessToken}` } });
      if (response.ok) { user = await response.json(); supabaseUser = true; }
    } else {
      user = await base44.auth.me();
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const getGym = async () => {
      let gyms = supabaseUser ? await select('gyms', `owner_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`) : [];
      if (!gyms[0]) gyms = await select('gyms', `email=eq.${encodeURIComponent(user.email || '')}&select=*&limit=1`);
      return gyms[0] || null;
    };

    const loadMemberData = async () => {
      if (!supabaseUser) return null;
      const memberRows = await select('members', `user_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`);
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
        profile: { id: member.id, name: member.full_name, memberId: metadata.memberId || member.id.slice(0, 8).toUpperCase(), phone: member.phone, email: member.email || user.email || '', gym: gyms[0]?.name || '', joinDate: String(member.joined_at || member.created_at).slice(0, 10), avatar: initials, photoUrl: member.avatar_url || null },
        membership: { plan: plan?.name || 'No plan', price: amountDue, startDate: membership?.start_date || '', expiryDate: membership?.end_date || '', status, autoRenew: Boolean(membership?.auto_renew) },
        balance: { price: amountDue, paid: amountPaid, balance: Math.max(0, amountDue - amountPaid), status: amountDue <= amountPaid ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Outstanding', renewalDate: membership?.end_date || '' },
        payments: payments.map((payment: any) => ({ id: payment.id, amount: Number(payment.amount || 0), date: String(payment.paid_at || payment.created_at).slice(0, 10), method: String(payment.method || '').replace(/_/g, ' '), status: 'Paid', reference: payment.reference || '' })),
        attendance: attendance.map((item: any) => ({ id: item.id, checkedInAt: item.check_in_at, date: String(item.check_in_at).slice(0, 10) })),
        notifications: notifications.map((item: any) => ({ id: item.id, title: item.title, description: item.body || '', read: Boolean(item.read), createdAt: item.created_at })),
        feedback: feedback.map((item: any) => ({ id: item.id, type: item.type, title: item.title, body: item.body || '', status: item.status, date: String(item.created_at).slice(0, 10), response: item.response || null }))
      };
    };

    if (operation === 'join') {
      if (!supabaseUser) return Response.json({ error: 'Sign in before joining your gym' }, { status: 401 });
      const phone = String(body.phone || '').trim();
      const fullName = String(body.fullName || '').trim();
      if (!phone || !fullName) return Response.json({ error: 'Phone and full name are required' }, { status: 400 });
      const matches = await select('members', `phone=eq.${encodeURIComponent(phone)}&full_name=ilike.${encodeURIComponent(fullName)}&select=*&limit=2`);
      if (matches.length !== 1) return Response.json({ error: 'Member details did not match exactly' }, { status: 404 });
      const member = matches[0];
      if (member.user_id && member.user_id !== user.id) return Response.json({ error: 'This membership is already linked to another account' }, { status: 409 });
      await update('members', `id=eq.${encodeURIComponent(member.id)}`, { user_id: user.id });
      await insert('profiles?on_conflict=id', { id: user.id, gym_id: member.gym_id, role: 'member', full_name: member.full_name, phone: member.phone, avatar_url: member.avatar_url || null }, 'resolution=merge-duplicates,return=representation');
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
      const memberRows = await select('members', `user_id=eq.${encodeURIComponent(user.id)}&select=id,gym_id&limit=1`);
      const input = body.feedback || {};
      if (!input.title?.trim() || !input.body?.trim()) return Response.json({ error: 'Title and details are required' }, { status: 400 });
      await insert('feedback_requests', { gym_id: memberRows[0].gym_id, member_id: memberRows[0].id, type: input.type, title: input.title.trim(), body: input.body.trim(), status: 'Pending' });
      return Response.json({ member: await loadMemberData() });
    }

    const gym = await getGym();
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });
    if (operation === 'inviteStaff') {
      const email = String(body.email || '').trim().toLowerCase();
      const role = String(body.role || 'Front Desk');
      if (!email || !['Manager', 'Front Desk', 'Cashier'].includes(role)) return Response.json({ error: 'Valid email and role are required' }, { status: 400 });
      const inviteResponse = await fetch(`${origin}/auth/v1/invite`, { method: 'POST', headers, body: JSON.stringify({ email, data: { full_name: email.split('@')[0] } }) });
      if (!inviteResponse.ok) throw new Error((await inviteResponse.text()) || 'Unable to invite staff');
      const invited = await inviteResponse.json();
      await insert('profiles?on_conflict=id', { id: invited.id, gym_id: gym.id, role: 'staff', full_name: invited.user_metadata?.full_name || email.split('@')[0] }, 'resolution=merge-duplicates,return=representation');
      await insert('staff', { gym_id: gym.id, user_id: invited.id, staff_role: role, permissions: [], status: 'Invited', invited_by: supabaseUser ? user.id : null });
    }
    if (operation === 'revokeStaff') {
      await request(`staff?id=eq.${encodeURIComponent(String(body.id || ''))}&gym_id=eq.${encodeURIComponent(gym.id)}`, { method: 'DELETE' });
    }
    const rows = await select('staff', `gym_id=eq.${encodeURIComponent(gym.id)}&select=*&order=created_at.desc`);
    const staff = await Promise.all(rows.map(async (item: any) => {
      const authResponse = await fetch(`${origin}/auth/v1/admin/users/${item.user_id}`, { headers });
      const authUser = authResponse.ok ? await authResponse.json() : null;
      const profiles = await select('profiles', `id=eq.${encodeURIComponent(item.user_id)}&select=*&limit=1`);
      return { id: item.id, name: profiles[0]?.full_name || authUser?.email?.split('@')[0] || 'Staff member', email: authUser?.email || '', role: item.staff_role, status: item.status, lastActive: item.last_active_at ? new Date(item.last_active_at).toLocaleDateString() : 'Never' };
    }));
    return Response.json({ staff });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 500 });
  }
}