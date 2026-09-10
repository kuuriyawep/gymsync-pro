import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const operation = body.operation;
    if (!['bootstrap', 'create', 'update', 'delete'].includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });
    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
    let user: any = null;
    let supabaseUser = false;
    if (body.accessToken) {
      const authResponse = await fetch(`${new URL(restUrl).origin}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: `Bearer ${body.accessToken}` } });
      if (authResponse.ok) { user = await authResponse.json(); supabaseUser = true; }
    } else {
      user = await base44.auth.me();
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const request = async (path: string, options: RequestInit = {}) => {
      const response = await fetch(`${restUrl}/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
      if (!response.ok) throw new Error((await response.text()) || 'Supabase request failed');
      if (response.status === 204) return null;
      return response.json();
    };
    const select = (table: string, query: string) => request(`${table}?${query}`);
    const insert = (table: string, data: unknown) => request(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(data) });
    const update = (table: string, query: string, data: unknown) => request(`${table}?${query}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(data) });

    const ownerEmail = user.email || `${user.id}@gymsync.local`;
    let gyms = supabaseUser ? await select('gyms', `owner_id=eq.${encodeURIComponent(user.id)}&select=*&limit=1`) : [];
    if (!gyms[0]) gyms = await select('gyms', `email=eq.${encodeURIComponent(ownerEmail)}&select=*&limit=1`);
    let gym = gyms[0];
    if (!gym) {
      const created = await insert('gyms', { name: 'Olympic Gym', email: ownerEmail, ...(supabaseUser ? { owner_id: user.id } : {}) });
      gym = created[0];
    } else if (supabaseUser && !gym.owner_id) {
      gym = (await update('gyms', `id=eq.${encodeURIComponent(gym.id)}`, { owner_id: user.id }))[0];
    }
    const gymFilter = encodeURIComponent(gym.id);

    const normalizeMethod = (value: string) => value === 'Mobile Money' ? 'mobile_money' : value.toLowerCase().replace(/\s+/g, '_');
    const memberStatus = (value: string) => value === 'Suspended' ? 'suspended' : 'active';
    const ensurePlan = async (name: string, price: number) => {
      const found = await select('membership_plans', `gym_id=eq.${gymFilter}&name=eq.${encodeURIComponent(name)}&select=*&limit=1`);
      if (found[0]) return found[0];
      const durations: Record<string, number> = { Monthly: 1, '3 Months': 3, '6 Months': 6, Custom: 1 };
      return (await insert('membership_plans', { gym_id: gym.id, name, duration_months: durations[name] || 1, price, is_active: true }))[0];
    };

    const seeds = [
      ['GYM-1001','Sarah Chen','+1 555 0101','sarah.chen@olympicgym.com','Monthly',60,'Active','2026-06-20','2026-09-15','Paid','Card'],
      ['GYM-1002','Marcus Reed','+1 555 0102','marcus.reed@olympicgym.com','3 Months',150,'Active','2026-05-12','2026-11-20','Paid','Mobile Money'],
      ['GYM-1003','Lena Park','+1 555 0103','lena.park@olympicgym.com','Monthly',60,'Expiring Soon','2026-07-30','2026-08-25','Pending','Cash'],
      ['GYM-1004','Diego Santos','+1 555 0104','diego.santos@olympicgym.com','6 Months',300,'Expired','2026-02-10','2026-08-10','Overdue','Card'],
      ['GYM-1005','Aisha Khan','+1 555 0105','aisha.khan@olympicgym.com','Monthly',60,'Active','2026-06-01','2026-09-01','Paid','Mobile Money'],
      ['GYM-1006','Tom Walsh','+1 555 0106','tom.walsh@olympicgym.com','3 Months',150,'Suspended','2026-04-18','2026-10-05','Pending','Cash'],
      ['GYM-1007','Nina Costa','+1 555 0107','nina.costa@olympicgym.com','Monthly',60,'Expiring Soon','2026-07-22','2026-08-22','Paid','Card'],
      ['GYM-1008','Omar Farah','+1 555 0108','omar.farah@olympicgym.com','Monthly',60,'Active','2026-08-01','2026-09-30','Paid','Mobile Money'],
      ['GYM-1009','Grace Lee','+1 555 0109','grace.lee@olympicgym.com','6 Months',300,'Expiring Soon','2026-03-15','2026-08-27','Pending','Cash'],
      ['GYM-1010','Liam Doyle','+1 555 0110','liam.doyle@olympicgym.com','Monthly',60,'Expired','2026-01-25','2026-07-30','Overdue','Card'],
      ['GYM-1011','Hana Yusuf','+1 555 0111','hana.yusuf@olympicgym.com','3 Months',150,'Active','2026-07-18','2026-10-18','Paid','Mobile Money'],
      ['GYM-1012','Carlos Mendez','+1 555 0112','carlos.mendez@olympicgym.com','Monthly',60,'Active','2026-08-10','2026-09-10','Paid','Cash']
    ];

    const existing = await select('members', `gym_id=eq.${gymFilter}&select=id&limit=1`);
    if (operation === 'bootstrap' && existing.length === 0) {
      for (const row of seeds) {
        const [memberId, fullName, phone, email, planName, fee, status, startDate, expiryDate, paymentStatus, method] = row;
        const plan = await ensurePlan(String(planName), Number(fee));
        const metadata = JSON.stringify({ memberId, note: '', preferredTime: 'Flexible', status });
        const member = (await insert('members', { gym_id: gym.id, full_name: fullName, phone, email, status: memberStatus(String(status)), joined_at: `${startDate}T00:00:00Z`, notes: metadata }))[0];
        const paid = paymentStatus === 'Paid' ? Number(fee) : 0;
        const membership = (await insert('memberships', { member_id: member.id, gym_id: gym.id, plan_id: plan.id, start_date: startDate, end_date: expiryDate, amount_due: fee, amount_paid: paid, status: status === 'Expired' ? 'expired' : 'active' }))[0];
        if (paid > 0) await insert('payments', { gym_id: gym.id, member_id: member.id, membership_id: membership.id, amount: paid, method: normalizeMethod(String(method)), reference: `TXN-${String(memberId).split('-')[1]}`, note: 'Initial membership payment', paid_at: `${startDate}T00:00:00Z` });
      }
    }

    if (operation === 'create') {
      const input = body.member || {};
      if (!input.name?.trim() || !input.phone?.trim()) return Response.json({ error: 'Name and phone are required' }, { status: 400 });
      const rows = await select('members', `gym_id=eq.${gymFilter}&select=notes`);
      const numbers = rows.map((row: { notes: string }) => { try { return Number(JSON.parse(row.notes || '{}').memberId?.split('-')[1]) || 1000; } catch { return 1000; } });
      const next = Math.max(1000, ...numbers) + 1;
      const amount = Number(input.amount) || 0;
      const plan = await ensurePlan(input.plan || 'Monthly', amount);
      const metadata = JSON.stringify({ memberId: `GYM-${next}`, note: input.note || '', preferredTime: input.preferredTime || 'Flexible', status: input.status || 'Active' });
      const member = (await insert('members', { gym_id: gym.id, full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, notes: metadata, status: memberStatus(String(input.status || 'Active')), joined_at: `${input.startDate}T00:00:00Z` }))[0];
      const paid = input.paymentStatus === 'Paid' ? amount : 0;
      const membership = (await insert('memberships', { member_id: member.id, gym_id: gym.id, plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: amount, amount_paid: paid, status: input.status === 'Expired' ? 'expired' : 'active' }))[0];
      if (paid > 0) await insert('payments', { gym_id: gym.id, member_id: member.id, membership_id: membership.id, amount: paid, method: normalizeMethod(String(input.paymentMethod || 'Cash')), reference: `TXN-${next}`, note: 'Initial membership payment', paid_at: `${input.startDate}T00:00:00Z` });
    }

    if (operation === 'update') {
      const input = body.member || {};
      const id = encodeURIComponent(String(body.id || ''));
      const owned = await select('members', `id=eq.${id}&gym_id=eq.${gymFilter}&select=id,notes&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      let existingMetadata: any = {};
      try { existingMetadata = JSON.parse(owned[0].notes || '{}'); } catch { existingMetadata = {}; }
      const metadata = JSON.stringify({ memberId: existingMetadata.memberId, note: input.note || '', preferredTime: input.preferredTime || 'Flexible', status: input.status });
      await update('members', `id=eq.${id}&gym_id=eq.${gymFilter}`, { full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, notes: metadata, status: memberStatus(String(input.status)) });
      const plan = await ensurePlan(input.plan || 'Monthly', Number(input.amount) || 0);
      await update('memberships', `member_id=eq.${id}&gym_id=eq.${gymFilter}`, { plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: Number(input.amount) || 0, status: input.status === 'Expired' ? 'expired' : 'active' });
    }

    if (operation === 'delete') {
      const id = encodeURIComponent(String(body.id || ''));
      await request(`members?id=eq.${id}&gym_id=eq.${gymFilter}`, { method: 'DELETE' });
    }

    const [members, memberships, plans, payments] = await Promise.all([
      select('members', `gym_id=eq.${gymFilter}&select=*&order=created_at.desc`),
      select('memberships', `gym_id=eq.${gymFilter}&select=*&order=created_at.desc`),
      select('membership_plans', `gym_id=eq.${gymFilter}&select=*`),
      select('payments', `gym_id=eq.${gymFilter}&select=*&order=paid_at.desc`)
    ]);
    const titleCase = (value: string) => value.split(' ').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    const result = members.map((member: any, index: number) => {
      const membership = memberships.find((item: any) => item.member_id === member.id);
      const plan = plans.find((item: any) => item.id === membership?.plan_id);
      const payment = payments.find((item: any) => item.member_id === member.id);
      let metadata: any = {};
      try { metadata = JSON.parse(member.notes || '{}'); } catch { metadata = { note: member.notes || '' }; }
      const status = metadata.status || titleCase(member.status || 'active');
      const amountDue = Number(membership?.amount_due || plan?.price || 0);
      const amountPaid = Number(membership?.amount_paid || 0);
      return { id: member.id, memberId: metadata.memberId || `GYM-${1001 + index}`, name: member.full_name, phone: member.phone, email: member.email || '', plan: plan?.name || 'Monthly', fee: amountDue, status, startDate: membership?.start_date || member.joined_at.slice(0,10), expiryDate: membership?.end_date || '', paymentStatus: amountDue > amountPaid ? (status === 'Expired' ? 'Overdue' : 'Pending') : 'Paid', paymentMethod: payment?.method ? titleCase(payment.method.replace(/_/g, ' ')) : 'Cash', registeredDate: member.joined_at.slice(0,10), gym: gym.name, note: metadata.note || '', preferredTime: metadata.preferredTime || 'Flexible', photoUrl: member.avatar_url || null };
    });
    return Response.json({ members: result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to load members' }, { status: 500 });
  }
}