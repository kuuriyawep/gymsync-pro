import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createSupabaseRestClient } from '../../shared/supabaseRest.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const operation = body.operation;
    if (!['bootstrap', 'create', 'update', 'delete', 'recordPayment', 'updatePayment', 'deletePayment', 'createPlan', 'updatePlan', 'togglePlan', 'deletePlan', 'memberDetails'].includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });
    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const { headers, request, select, insert, update } = createSupabaseRestClient(restUrl, serviceKey);
    // All auth is handled by Base44 — identify the caller via base44.auth.me()
    const user: any = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const ownerEmail = String(user.email || '').toLowerCase();

    let gyms = await select('gyms', `email=eq.${encodeURIComponent(ownerEmail)}&select=*&limit=1`);
    let gym = gyms[0];
    if (!gym) return Response.json({ error: 'No gym found for this account. Complete owner onboarding first.' }, { status: 404 });
    const gymFilter = encodeURIComponent(gym.id);

    const normalizeMethod = (value: string) => value === 'Mobile Money' ? 'mobile_money' : value.toLowerCase().replace(/\s+/g, '_');
    const memberStatus = (value: string) => value === 'Suspended' ? 'suspended' : 'active';
    const ensurePlan = async (name: string, price: number) => {
      const found = await select('membership_plans', `gym_id=eq.${gymFilter}&name=eq.${encodeURIComponent(name)}&select=*&limit=1`);
      if (found[0]) return found[0];
      const durations: Record<string, number> = { Monthly: 1, '3 Months': 3, '6 Months': 6, Custom: 1 };
      return (await insert('membership_plans', { gym_id: gym.id, name, duration_months: durations[name] || 1, price, is_active: true }))[0];
    };

    if (operation === 'memberDetails') {
      const memberIdRaw = String(body.memberId || '');
      if (!memberIdRaw) return Response.json({ error: 'Member ID is required' }, { status: 400 });
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberIdRaw)) return Response.json({ error: 'Member not found' }, { status: 404 });
      const memberId = encodeURIComponent(memberIdRaw);
      // Authorization: verify the member belongs to the authenticated user's gym.
      // Never trust a client-supplied gym_id — ownership comes from the authed user's gym.
      const owned = await select('members', `id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      let memberMetadata: any = {};
      try { memberMetadata = JSON.parse(owned[0].notes || '{}'); } catch { memberMetadata = {}; }
      const [payments, attendance, memberships, plans] = await Promise.all([
        select('payments', `member_id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&order=paid_at.desc`),
        select('attendance', `member_id=eq.${memberId}&select=*&order=check_in_at.desc`),
        select('memberships', `member_id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&order=created_at.desc`),
        select('membership_plans', `gym_id=eq.${gymFilter}&select=*`)
      ]);
      const membership = memberships[0] || null;
      const plan = plans.find((p: any) => p.id === membership?.plan_id) || null;
      const paymentHistory = payments.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount || 0),
        date: p.paid_at ? String(p.paid_at).slice(0, 10) : (p.created_at ? String(p.created_at).slice(0, 10) : ''),
        method: String(p.method || '').replace(/_/g, ' '),
        status: 'Paid',
        reference: p.reference || ''
      }));
      const activities = [
        ...attendance.map((a: any) => ({
          id: `attendance-${a.id}`, type: 'Check-in', text: 'Checked in at the gym',
          time: a.check_in_at ? new Date(a.check_in_at).toLocaleDateString() : '', _ts: a.check_in_at || ''
        })),
        ...payments.map((p: any) => ({
          id: `payment-${p.id}`, type: 'Payment',
          text: `Payment recorded · $${Number(p.amount || 0)} · ${String(p.method || '').replace(/_/g, ' ')}`,
          time: p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '', _ts: p.paid_at || ''
        }))
      ].filter((a: any) => a._ts).sort((a: any, b: any) => new Date(b._ts).getTime() - new Date(a._ts).getTime()).map(({ _ts, ...rest }: any) => rest);
      const mAmountDue = Number(membership?.amount_due || 0);
      const mAmountPaid = Number(membership?.amount_paid || 0);
      const mBalance = memberMetadata.balance_override !== undefined && memberMetadata.balance_override >= 0 ? memberMetadata.balance_override : Math.max(0, mAmountDue - mAmountPaid);
      return Response.json({
        payments: paymentHistory,
        activities,
        gender: memberMetadata.gender || '',
        balance: mBalance,
        membership: membership ? {
          plan: plan?.name || 'No plan',
          startDate: membership.start_date || '',
          endDate: membership.end_date || '',
          amountDue: mAmountDue,
          amountPaid: mAmountPaid,
          status: membership.status || ''
        } : null
      });
    }

    if (operation === 'create') {
      const input = body.member || {};
      if (!input.name?.trim() || !input.phone?.trim()) return Response.json({ error: 'Name and phone are required' }, { status: 400 });
      if (!input.gender || !['Male', 'Female'].includes(input.gender)) return Response.json({ error: 'Gender is required' }, { status: 400 });
      const rows = await select('members', `gym_id=eq.${gymFilter}&select=notes`);
      const numbers = rows.map((row: { notes: string }) => { try { return Number(JSON.parse(row.notes || '{}').memberId?.split('-')[1]) || 1000; } catch { return 1000; } });
      const next = Math.max(1000, ...numbers) + 1;
      const amount = Number(input.amount) || 0;
      const amountPaid = Number(input.amountPaid) || 0;
      const balanceOverride = input.balanceOverride !== undefined && input.balanceOverride !== '' ? Number(input.balanceOverride) : null;
      const plan = await ensurePlan(input.plan || 'Monthly', amount);
      const metadataFields: any = { memberId: `GYM-${next}`, note: input.note || '', preferredTime: input.preferredTime || 'Flexible', status: input.status || 'Active', gender: input.gender };
      if (balanceOverride !== null && Number.isFinite(balanceOverride) && balanceOverride >= 0) metadataFields.balance_override = balanceOverride;
      const metadata = JSON.stringify(metadataFields);
      const member = (await insert('members', { gym_id: gym.id, full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, notes: metadata, status: memberStatus(String(input.status || 'Active')), joined_at: `${input.startDate}T00:00:00Z` }))[0];
      const membership = (await insert('memberships', { member_id: member.id, gym_id: gym.id, plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: amount, amount_paid: amountPaid, status: input.status === 'Expired' ? 'expired' : 'active' }))[0];
      if (amountPaid > 0) await insert('payments', { gym_id: gym.id, member_id: member.id, membership_id: membership.id, amount: amountPaid, method: normalizeMethod(String(input.paymentMethod || 'Cash')), reference: `TXN-${next}`, note: 'Initial membership payment', paid_at: `${input.startDate}T00:00:00Z` });
    }

    if (operation === 'update') {
      const input = body.member || {};
      const id = encodeURIComponent(String(body.id || ''));
      const owned = await select('members', `id=eq.${id}&gym_id=eq.${gymFilter}&select=id,notes&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      let existingMetadata: any = {};
      try { existingMetadata = JSON.parse(owned[0].notes || '{}'); } catch { existingMetadata = {}; }
      const amountPaid = Number(input.amountPaid) || 0;
      const balanceOverride = input.balanceOverride !== undefined && input.balanceOverride !== '' ? Number(input.balanceOverride) : null;
      const metadataFields: any = { memberId: existingMetadata.memberId, note: input.note || '', preferredTime: input.preferredTime || 'Flexible', status: input.status, gender: input.gender || existingMetadata.gender || '' };
      if (balanceOverride !== null && Number.isFinite(balanceOverride) && balanceOverride >= 0) metadataFields.balance_override = balanceOverride;
      const metadata = JSON.stringify(metadataFields);
      await update('members', `id=eq.${id}&gym_id=eq.${gymFilter}`, { full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, notes: metadata, status: memberStatus(String(input.status)) });
      const plan = await ensurePlan(input.plan || 'Monthly', Number(input.amount) || 0);
      await update('memberships', `member_id=eq.${id}&gym_id=eq.${gymFilter}`, { plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: Number(input.amount) || 0, amount_paid: amountPaid, status: input.status === 'Expired' ? 'expired' : 'active' });
    }

    if (operation === 'delete') {
      const id = encodeURIComponent(String(body.id || ''));
      await request(`members?id=eq.${id}&gym_id=eq.${gymFilter}`, { method: 'DELETE' });
    }

    if (operation === 'recordPayment') {
      const input = body.payment || {};
      const memberId = encodeURIComponent(String(input.memberId || ''));
      const amount = Number(input.amount);
      if (!memberId || !Number.isFinite(amount) || amount <= 0 || !input.date) return Response.json({ error: 'Member, positive amount and payment date are required' }, { status: 400 });
      const owned = await select('members', `id=eq.${memberId}&gym_id=eq.${gymFilter}&select=id&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      const memberships = await select('memberships', `member_id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&order=created_at.desc&limit=1`);
      const membership = memberships[0] || null;
      const reference = `TXN-${Date.now()}`;
      await insert('payments', { gym_id: gym.id, member_id: owned[0].id, membership_id: membership?.id || null, amount, method: normalizeMethod(String(input.method || 'Cash')), reference, note: String(input.notes || ''), paid_at: `${input.date}T00:00:00Z` });
      if (membership) {
        const amountDue = Number(membership.amount_due || 0);
        const nextPaid = Math.min(amountDue, Number(membership.amount_paid || 0) + amount);
        await update('memberships', `id=eq.${encodeURIComponent(membership.id)}&gym_id=eq.${gymFilter}`, { amount_paid: nextPaid });
      }
    }

    if (operation === 'updatePayment') {
      const id = encodeURIComponent(String(body.id || ''));
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(body.id || ''))) return Response.json({ error: 'Payment not found' }, { status: 404 });
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 0) return Response.json({ error: 'A valid non-negative amount is required' }, { status: 400 });
      const dateRaw = String(body.date || '');
      if (!dateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return Response.json({ error: 'A valid payment date is required' }, { status: 400 });
      const rows = await select('payments', `id=eq.${id}&gym_id=eq.${gymFilter}&select=*&limit=1`);
      if (!rows[0]) return Response.json({ error: 'Payment not found' }, { status: 404 });
      const payment = rows[0];
      await update('payments', `id=eq.${id}&gym_id=eq.${gymFilter}`, {
        amount,
        method: normalizeMethod(String(body.method || 'Cash')),
        note: String(body.notes || '').slice(0, 500),
        paid_at: `${dateRaw}T00:00:00Z`
      });
      // Recalculate the linked membership's amount_paid
      if (payment.membership_id) {
        const membershipId = encodeURIComponent(payment.membership_id);
        const remaining = await select('payments', `membership_id=eq.${membershipId}&gym_id=eq.${gymFilter}&select=amount`);
        const totalPaid = remaining.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
        await update('memberships', `id=eq.${membershipId}&gym_id=eq.${gymFilter}`, { amount_paid: Math.min(Number((await select('memberships', `id=eq.${membershipId}&gym_id=eq.${gymFilter}&select=amount_due&limit=1`))[0]?.amount_due || 0), totalPaid) });
      }
    }

    if (operation === 'deletePayment') {
      const id = encodeURIComponent(String(body.id || ''));
      const rows = await select('payments', `id=eq.${id}&gym_id=eq.${gymFilter}&select=*&limit=1`);
      if (!rows[0]) return Response.json({ error: 'Payment not found' }, { status: 404 });
      const payment = rows[0];
      await request(`payments?id=eq.${id}&gym_id=eq.${gymFilter}`, { method: 'DELETE' });
      if (payment.membership_id) {
        const membershipId = encodeURIComponent(payment.membership_id);
        const memberships = await select('memberships', `id=eq.${membershipId}&gym_id=eq.${gymFilter}&select=*&limit=1`);
        if (memberships[0]) {
          const remaining = await select('payments', `membership_id=eq.${membershipId}&gym_id=eq.${gymFilter}&select=amount`);
          const totalPaid = remaining.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
          await update('memberships', `id=eq.${membershipId}&gym_id=eq.${gymFilter}`, { amount_paid: Math.min(Number(memberships[0].amount_due || 0), totalPaid) });
        }
      }
    }

    if (operation === 'createPlan' || operation === 'updatePlan') {
      const input = body.plan || {};
      const name = String(input.name || '').trim();
      const price = Number(input.price);
      const durationMonths = Math.max(1, Number.parseInt(String(input.duration), 10) || 1);
      if (!name || !Number.isFinite(price) || price < 0) return Response.json({ error: 'Valid plan name, price and duration are required' }, { status: 400 });
      const values = { name, price, duration_months: durationMonths, is_active: input.status !== 'Inactive' };
      if (operation === 'createPlan') await insert('membership_plans', { gym_id: gym.id, ...values });
      else {
        const id = encodeURIComponent(String(body.id || ''));
        const owned = await select('membership_plans', `id=eq.${id}&gym_id=eq.${gymFilter}&select=id&limit=1`);
        if (!owned[0]) return Response.json({ error: 'Membership plan not found' }, { status: 404 });
        await update('membership_plans', `id=eq.${id}&gym_id=eq.${gymFilter}`, values);
      }
    }

    if (operation === 'togglePlan') {
      const id = encodeURIComponent(String(body.id || ''));
      const owned = await select('membership_plans', `id=eq.${id}&gym_id=eq.${gymFilter}&select=id,is_active&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Membership plan not found' }, { status: 404 });
      await update('membership_plans', `id=eq.${id}&gym_id=eq.${gymFilter}`, { is_active: !owned[0].is_active });
    }

    if (operation === 'deletePlan') {
      const id = encodeURIComponent(String(body.id || ''));
      const used = await select('memberships', `plan_id=eq.${id}&gym_id=eq.${gymFilter}&select=id&limit=1`);
      if (used[0]) return Response.json({ error: 'A plan assigned to members cannot be deleted' }, { status: 409 });
      await request(`membership_plans?id=eq.${id}&gym_id=eq.${gymFilter}`, { method: 'DELETE' });
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
      const balance = metadata.balance_override !== undefined && metadata.balance_override >= 0 ? metadata.balance_override : Math.max(0, amountDue - amountPaid);
      return { id: member.id, memberId: metadata.memberId || `GYM-${1001 + index}`, name: member.full_name, phone: member.phone, email: member.email || '', gender: metadata.gender || '', plan: plan?.name || 'Monthly', fee: amountDue, amountPaid, balance, balanceOverride: metadata.balance_override !== undefined ? metadata.balance_override : null, status, startDate: membership?.start_date || member.joined_at.slice(0,10), expiryDate: membership?.end_date || '', paymentStatus: amountDue > amountPaid ? (status === 'Expired' ? 'Overdue' : 'Pending') : 'Paid', paymentMethod: payment?.method ? titleCase(payment.method.replace(/_/g, ' ')) : 'Cash', registeredDate: member.joined_at.slice(0,10), gym: gym.name, note: metadata.note || '', preferredTime: metadata.preferredTime || 'Flexible', photoUrl: member.avatar_url || null, createdAt: member.created_at, updatedAt: member.updated_at };
    });
    const names = new Map(members.map((member: any) => [member.id, member.full_name]));
    const memberActivities = members.map((member: any) => ({ id: `member-${member.id}`, type: 'member', text: `${member.full_name} was added as a member`, occurredAt: member.created_at }));
    const paymentActivities = payments.map((payment: any) => ({ id: `payment-${payment.id}`, type: 'payment', text: `$${Number(payment.amount || 0).toLocaleString()} payment received from ${names.get(payment.member_id) || 'a member'}`, occurredAt: payment.paid_at || payment.created_at }));
    const updateActivities = members.filter((member: any) => member.updated_at && new Date(member.updated_at).getTime() - new Date(member.created_at).getTime() > 1000).map((member: any) => ({ id: `update-${member.id}`, type: 'update', text: `${member.full_name}'s profile was updated`, occurredAt: member.updated_at }));
    const recentActivities = [...memberActivities, ...paymentActivities, ...updateActivities].filter((item: any) => item.occurredAt).sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 10);
    const analytics = {
      payments: payments.map((payment: any) => ({ id: payment.id, memberId: payment.member_id, membershipId: payment.membership_id || null, memberName: names.get(payment.member_id) || 'Unknown member', amount: Number(payment.amount || 0), method: payment.method || '', reference: payment.reference || '', note: payment.note || '', paidAt: payment.paid_at || payment.created_at })),
      memberships: memberships.map((membership: any) => ({ id: membership.id, memberId: membership.member_id, planId: membership.plan_id, startDate: membership.start_date, endDate: membership.end_date, amountDue: Number(membership.amount_due || 0), amountPaid: Number(membership.amount_paid || 0), status: membership.status, createdAt: membership.created_at })),
      plans: plans.map((plan: any) => ({ id: plan.id, name: plan.name, price: Number(plan.price || 0), duration: `${Number(plan.duration_months || 1)} ${Number(plan.duration_months || 1) === 1 ? 'month' : 'months'}`, status: plan.is_active ? 'Active' : 'Inactive', activeMembers: memberships.filter((membership: any) => membership.plan_id === plan.id && membership.status === 'active').length })),
      recentActivities
    };
    return Response.json({ members: result, analytics });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to load members' }, { status: 500 });
  }
}