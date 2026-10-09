import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { secrets } from 'base44:runtime';
import { createSupabaseRestClient } from '../../shared/supabaseRest.ts';
import { deny, hasPermission, resolveAccess } from '../../shared/authz.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const operation = body.operation;
    if (!['bootstrap', 'create', 'update', 'renew', 'delete', 'recordPayment', 'updatePayment', 'deletePayment', 'createPlan', 'updatePlan', 'togglePlan', 'deletePlan', 'memberDetails'].includes(operation)) return Response.json({ error: 'Invalid operation' }, { status: 400 });
    const restUrl = secrets.get('SUPABASE_URL').replace(/\/$/, '');
    const serviceKey = secrets.get('SUPABASE_SERVICE_ROLE_KEY');
    const rest = createSupabaseRestClient(restUrl, serviceKey);
    const { request, select, insert, update } = rest;
    const supabaseAccessToken = String(body._supabaseAccessToken || '');
    const access = await resolveAccess(base44, rest, { url: restUrl, serviceKey, accessToken: supabaseAccessToken });
    const gym = access.gym;
    if (!gym) return Response.json({ error: 'No gym found for this account.' }, { status: 404 });
    const gymFilter = encodeURIComponent(gym.id);
    const readMembers = hasPermission(access, 'members.read');
    const writeMembers = hasPermission(access, 'members.write');
    const readPayments = hasPermission(access, 'payments.read');
    const writePayments = hasPermission(access, 'payments.write');
    const writePlans = hasPermission(access, 'plans.write');
    const notificationEnabled = (key: string) => Boolean(gym.settings?.notifications?.[key] ?? true);
    const notifyOwner = async (key: string, title: string, message: string) => {
      if (!notificationEnabled(key) || !gym.owner_id) return;
      await insert('notifications', {
        gym_id: gym.id,
        user_id: gym.owner_id,
        type: key,
        title,
        message: message.slice(0, 500),
      });
    };
    const notifyOwnerOnce = async (key: string, title: string, message: string) => {
      if (!notificationEnabled(key) || !gym.owner_id) return;
      const existing = await select(
        'notifications',
        `gym_id=eq.${encodeURIComponent(gym.id)}&user_id=eq.${encodeURIComponent(gym.owner_id)}&type=eq.${encodeURIComponent(key)}&title=eq.${encodeURIComponent(title)}&message=eq.${encodeURIComponent(message.slice(0, 500))}&select=id&limit=1`
      );
      if (!existing[0]) await notifyOwner(key, title, message);
    };
    const lifecycleStatus = (membership: any, member: any, fallback = 'Active') => {
      if (String(member?.status || '').toLowerCase() === 'suspended') return 'Suspended';
      const expiry = String(membership?.end_date || '');
      const today = new Date().toISOString().slice(0, 10);
      if (String(membership?.status || '').toLowerCase() === 'expired' || (expiry && expiry < today)) return 'Expired';
      if (expiry) {
        const days = Math.floor((new Date(`${expiry}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
        if (days >= 0 && days <= 7) return 'Expiring Soon';
      }
      return fallback;
    };
    // audit_logs.actor_id is a Supabase Auth UUID. Legacy Base44 identities are
    // not UUIDs, so only attach actor_id when the canonical Supabase identity
    // is available; the gym/action/entity still make the event auditable.
    const audit = async (action: string, entityId: string | null, metadata: Record<string, any> = {}) => {
      const actorId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(access.userId) ? access.userId : null;
      await insert('audit_logs', {
        gym_id: gym.id,
        actor_id: actorId,
        action,
        entity_type: 'payment',
        entity_id: entityId,
        metadata
      });
    };
    if (operation === 'bootstrap' && !readMembers && !readPayments) return deny();
    if (operation === 'memberDetails' && !readMembers) return deny();
    if (['create', 'update', 'renew', 'delete'].includes(operation) && !writeMembers) return deny();
    if (['recordPayment', 'updatePayment', 'deletePayment'].includes(operation) && !writePayments) return deny();
    if (['createPlan', 'updatePlan', 'togglePlan', 'deletePlan'].includes(operation) && !writePlans) return deny();

    // A payment entered for today should show as "just now", not "16 hours
    // ago" because its time got forced to midnight UTC. Genuinely backdated
    // entries (owner catching up on an old cash payment) keep the plain
    // date, since day-level accuracy is all that matters there.
    const resolvePaidAt = (dateStr: string) => {
      const today = new Date().toISOString().slice(0, 10);
      return dateStr === today ? new Date().toISOString() : `${dateStr}T00:00:00Z`;
    };
    const normalizeMethod = (value: string) => value === 'Mobile Money' ? 'mobile_money' : value.toLowerCase().replace(/\s+/g, '_');
    const memberStatus = (value: string) => value === 'Suspended' ? 'suspended' : 'active';

    // The membership balance is a derived value: it must always equal the
    // sum of its payment ledger, capped at the membership amount due.
    // Recomputing from the ledger avoids drift after edits, deletes and
    // backdated payment moves.
    const recalculateMembershipPaid = async (membershipId: string) => {
      const membershipRows = await select('memberships', 'id=eq.' + encodeURIComponent(membershipId) + '&gym_id=eq.' + gymFilter + '&select=id,amount_due&limit=1');
      const membership = membershipRows[0];
      if (!membership) return;
      const payments = await select('payments', 'membership_id=eq.' + encodeURIComponent(membershipId) + '&gym_id=eq.' + gymFilter + '&select=amount');
      const totalPaid = payments.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
      await update('memberships', 'id=eq.' + encodeURIComponent(membershipId) + '&gym_id=eq.' + gymFilter, {
        amount_paid: Math.min(Number(membership.amount_due || 0), totalPaid)
      });
    };

    const findMembershipForPaymentDate = async (memberId: string, paymentDate: string) => {
      const memberships = await select('memberships', 'member_id=eq.' + encodeURIComponent(memberId) + '&gym_id=eq.' + gymFilter + '&select=id,start_date,end_date,created_at&order=created_at.desc');
      return memberships.find((item: any) => {
        const start = String(item.start_date || '');
        const end = String(item.end_date || '');
        return start && end && paymentDate >= start && paymentDate <= end;
      }) || null;
    };
    const ensurePlan = async (name: string, price: number) => {
      const found = await select('membership_plans', `gym_id=eq.${gymFilter}&name=eq.${encodeURIComponent(name)}&select=*&limit=1`);
      if (found[0]) return found[0];
      // Creating a plan is a plans.write operation. A staff member may use an
      // existing plan while registering/editing a member, but must not be able
      // to create a new plan as a side effect of a member write.
      if (!writePlans) throw new Error('Membership plan not found');
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
        readPayments
          ? select('payments', `member_id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&order=paid_at.desc`)
          : Promise.resolve([]),
        select('attendance', `member_id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&order=check_in_at.desc`),
        select('memberships', `member_id=eq.${memberId}&gym_id=eq.${gymFilter}&select=*&order=created_at.desc`),
        select('membership_plans', `gym_id=eq.${gymFilter}&select=*`)
      ]);
      const today = new Date().toISOString().slice(0, 10);
      const membership = memberships.find((item: any) => String(item.start_date || '') <= today && (!item.end_date || String(item.end_date) >= today)) || memberships[0] || null;
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
        ...(readPayments ? payments.map((p: any) => ({
          id: `payment-${p.id}`, type: 'Payment',
          text: `Payment recorded · ${Number(p.amount || 0)} · ${String(p.method || '').replace(/_/g, ' ')}`,
          time: p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '', _ts: p.paid_at || ''
        })) : [])
      ].filter((a: any) => a._ts).sort((a: any, b: any) => new Date(b._ts).getTime() - new Date(a._ts).getTime()).map(({ _ts, ...rest }: any) => rest);
      const mAmountDue = Number(membership?.amount_due || 0);
      const mAmountPaid = Number(membership?.amount_paid || 0);
      const membershipExpiry = String(membership?.end_date || '');
      const membershipDays = membershipExpiry ? Math.floor((new Date(`${membershipExpiry}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000) : null;
      const membershipStatus = String(owned[0].status || '').toLowerCase() === 'suspended'
        ? 'suspended'
        : String(membership?.status || '').toLowerCase() === 'expired' || (membershipExpiry && membershipExpiry < today)
          ? 'expired'
          : membershipDays !== null && membershipDays >= 0 && membershipDays <= 7
            ? 'expiring'
            : (membership?.status || 'active');
      const mBalance = memberMetadata.balance_override !== undefined && memberMetadata.balance_override >= 0 ? memberMetadata.balance_override : Math.max(0, mAmountDue - mAmountPaid);
      return Response.json({
        payments: readPayments ? paymentHistory : [],
        activities,
        gender: memberMetadata.gender || '',
        canViewPayments: readPayments,
        canRecordPayments: writePayments,
        balance: readPayments ? mBalance : null,
        membership: membership ? {
          plan: plan?.name || 'No plan',
          startDate: membership.start_date || '',
          endDate: membership.end_date || '',
          amountDue: readPayments ? mAmountDue : null,
          amountPaid: readPayments ? mAmountPaid : null,
          status: membershipStatus
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
      const amountPaid = Number(input.amountPaid) || 0;
      const balanceOverride = input.balanceOverride !== undefined && input.balanceOverride !== '' ? Number(input.balanceOverride) : null;
      // Price comes only from the plan the owner already set up in Membership
      // Plans — never from a client-supplied amount. If the named plan
      // somehow doesn't exist yet, it's created at $0 rather than trusting an
      // arbitrary frontend price; the real fix in that case is adding the
      // plan properly on the Membership page.
      const plan = await ensurePlan(input.plan || 'Monthly', 0);
      const amountDue = Number(plan.price) || 0;
      // Never let a recorded payment exceed what's actually owed — same
      // capping rule recordPayment already applies, so a balance can't go
      // negative regardless of what was typed into Amount Paid.
      const cappedPaid = Math.min(amountDue, amountPaid);
      const joinToken = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      const metadataFields: any = { memberId: `GYM-${next}`, note: input.note || '', preferredTime: input.preferredTime || 'Flexible', status: input.status || 'Active', gender: input.gender, joinToken };
      if (balanceOverride !== null && Number.isFinite(balanceOverride) && balanceOverride >= 0) metadataFields.balance_override = balanceOverride;
      const metadata = JSON.stringify(metadataFields);
      const member = (await insert('members', { gym_id: gym.id, full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, base44_user_id: null, notes: metadata, status: memberStatus(String(input.status || 'Active')), joined_at: `${input.startDate}T00:00:00Z` }))[0];
      const membership = (await insert('memberships', { member_id: member.id, gym_id: gym.id, plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: amountDue, amount_paid: cappedPaid, status: input.status === 'Expired' ? 'expired' : 'active' }))[0];
      // The real payment record keeps the full amount actually paid (even if
      // it exceeds amountDue) — only the membership's running balance is
      // capped, the payment history itself is never altered.
      if (amountPaid > 0) {
        await insert('payments', { gym_id: gym.id, member_id: member.id, membership_id: membership.id, amount: amountPaid, method: normalizeMethod(String(input.paymentMethod || 'Cash')), reference: `TXN-${next}`, note: 'Initial membership payment', paid_at: resolvePaidAt(input.startDate) });
        await notifyOwner('payments', 'Payment received', `${member.full_name} paid $${Number(amountPaid).toLocaleString()}`);
      }
      await notifyOwner('newMembers', 'New member registered', `${member.full_name} joined ${gym.name}`);
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
      const joinToken = existingMetadata.joinToken || Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      const metadataFields: any = { memberId: existingMetadata.memberId, note: input.note || '', preferredTime: input.preferredTime || 'Flexible', status: input.status, gender: input.gender || existingMetadata.gender || '', joinToken };
      if (balanceOverride !== null && Number.isFinite(balanceOverride) && balanceOverride >= 0) metadataFields.balance_override = balanceOverride;
      const metadata = JSON.stringify(metadataFields);
      await update('members', `id=eq.${id}&gym_id=eq.${gymFilter}`, { full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, notes: metadata, status: memberStatus(String(input.status)) });
      // Editing a member must never silently rewrite the financial ledger.
      // Amount paid changes belong to a payment transaction (or renewal).
      const plan = await ensurePlan(input.plan || 'Monthly', 0);
      const amountDue = Number(plan.price) || 0;
      const existingMemberships = await select('memberships', `member_id=eq.${id}&gym_id=eq.${gymFilter}&select=id,amount_paid&order=created_at.desc&limit=1`);
      const latestMembership = existingMemberships[0];
      const existingPaid = Number(latestMembership?.amount_paid || 0);
      if (latestMembership) {
        // Update only the current/latest membership. Historical memberships must
        // remain immutable so past plan, dates and financial records stay intact.
        await update('memberships', `id=eq.${encodeURIComponent(latestMembership.id)}&gym_id=eq.${gymFilter}`, { plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: amountDue, amount_paid: existingPaid, status: input.status === 'Expired' ? 'expired' : 'active' });
      } else {
        await insert('memberships', { member_id: owned[0].id, gym_id: gym.id, plan_id: plan.id, start_date: input.startDate, end_date: input.expiryDate, amount_due: amountDue, amount_paid: 0, status: input.status === 'Expired' ? 'expired' : 'active' });
      }
    }

    if (operation === 'renew') {
      const input = body.member || {};
      const memberIdRaw = String(body.id || '');
      const id = encodeURIComponent(memberIdRaw);
      if (!memberIdRaw) return Response.json({ error: 'Member not found' }, { status: 404 });
      const owned = await select('members', `id=eq.${id}&gym_id=eq.${gymFilter}&select=id,full_name,notes&limit=1`);
      if (!owned[0]) return Response.json({ error: 'Member not found' }, { status: 404 });
      const plan = await ensurePlan(input.plan || 'Monthly', 0);
      const amountDue = Number(plan.price) || 0;
      const renewalPayment = Number(input.amountPaid) || 0;
      if (!Number.isFinite(renewalPayment) || renewalPayment < 0) return Response.json({ error: 'Invalid renewal payment amount' }, { status: 400 });
      if (!input.startDate || !input.expiryDate) return Response.json({ error: 'Renewal start and expiry dates are required' }, { status: 400 });
      const cappedPaid = Math.min(amountDue, renewalPayment);
      // Close the previous current period before creating the new renewal.
      // Its dates, plan and payment history remain unchanged; only its lifecycle
      // status moves out of active so there is never more than one active period.
      const previousMemberships = await select('memberships', `member_id=eq.${id}&gym_id=eq.${gymFilter}&select=id,status&order=created_at.desc&limit=1`);
      const previousMembership = previousMemberships[0];
      if (previousMembership?.status === 'active') {
        await update('memberships', `id=eq.${encodeURIComponent(previousMembership.id)}&gym_id=eq.${gymFilter}`, { status: 'expired' });
      }
      let existingMetadata: any = {};
      try { existingMetadata = JSON.parse(owned[0].notes || '{}'); } catch { existingMetadata = {}; }
      const metadata = JSON.stringify({ ...existingMetadata, note: input.note || '', preferredTime: input.preferredTime || existingMetadata.preferredTime || 'Flexible', status: input.status || 'Active', gender: input.gender || existingMetadata.gender || '' });
      await update('members', `id=eq.${id}&gym_id=eq.${gymFilter}`, { full_name: input.name.trim(), phone: input.phone.trim(), email: input.email || null, avatar_url: input.photoUrl || null, notes: metadata, status: memberStatus(String(input.status || 'Active')) });
      // Renewal starts a new membership period. Never overwrite the previous
      // membership because its dates, plan and linked payments are historical
      // financial records that must remain immutable.
      const membership = (await insert('memberships', {
        member_id: owned[0].id,
        gym_id: gym.id,
        plan_id: plan.id,
        start_date: input.startDate,
        end_date: input.expiryDate,
        amount_due: amountDue,
        amount_paid: cappedPaid,
        status: 'active'
      }))[0];
      if (renewalPayment > 0) {
        await insert('payments', { gym_id: gym.id, member_id: owned[0].id, membership_id: membership.id, amount: renewalPayment, method: normalizeMethod(String(input.paymentMethod || 'Cash')), reference: `TXN-${Date.now()}`, note: 'Membership renewal payment', paid_at: resolvePaidAt(input.startDate) });
        await notifyOwner('payments', 'Payment received', `${owned[0].full_name} paid $${Number(renewalPayment).toLocaleString()} for renewal`);
      }
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
      const paymentDate = String(input.date);
      const membership = await findMembershipForPaymentDate(String(input.memberId), paymentDate);
      const reference = `TXN-${Date.now()}`;
      const payment = (await insert('payments', { gym_id: gym.id, member_id: owned[0].id, membership_id: membership?.id || null, amount, method: normalizeMethod(String(input.method || 'Cash')), reference, note: String(input.notes || ''), paid_at: resolvePaidAt(paymentDate) }))[0];
      await audit('payment.recorded', payment?.id || null, {
        member_id: owned[0].id,
        membership_id: membership?.id || null,
        amount,
        payment_date: paymentDate,
        method: normalizeMethod(String(input.method || 'Cash'))
      });
      const memberRows = await select('members', `id=eq.${memberId}&gym_id=eq.${gymFilter}&select=full_name&limit=1`);
      await notifyOwner('payments', 'Payment received', `${memberRows[0]?.full_name || 'A member'} paid ${Number(amount).toLocaleString()}`);
      if (membership) {
        // Derive the membership's paid amount from its ledger instead of
        // incrementing the stored value, which may already be out of sync.
        await recalculateMembershipPaid(membership.id);
      }
    }

    if (operation === 'updatePayment') {
      const id = encodeURIComponent(String(body.id || ''));
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(body.id || ''))) return Response.json({ error: 'Payment not found' }, { status: 404 });
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) return Response.json({ error: 'Payment amount must be greater than 0' }, { status: 400 });
      const dateRaw = String(body.date || '');
      if (!dateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return Response.json({ error: 'A valid payment date is required' }, { status: 400 });
      const rows = await select('payments', `id=eq.${id}&gym_id=eq.${gymFilter}&select=*&limit=1`);
      if (!rows[0]) return Response.json({ error: 'Payment not found' }, { status: 404 });
      const payment = rows[0];
      const oldMembershipId = payment.membership_id || null;
      const newMembership = await findMembershipForPaymentDate(payment.member_id, dateRaw);
      await update('payments', `id=eq.${id}&gym_id=eq.${gymFilter}`, {
        amount,
        method: normalizeMethod(String(body.method || 'Cash')),
        note: String(body.notes || '').slice(0, 500),
        paid_at: resolvePaidAt(dateRaw),
        membership_id: newMembership?.id || null
      });
      await audit('payment.updated', payment.id, {
        member_id: payment.member_id,
        membership_id: payment.membership_id || null,
        before: {
          amount: Number(payment.amount || 0),
          method: payment.method || '',
          paid_at: payment.paid_at || null,
          note: payment.note || ''
        },
        after: {
          amount,
          method: normalizeMethod(String(body.method || 'Cash')),
          paid_at: resolvePaidAt(dateRaw),
          note: String(body.notes || '').slice(0, 500)
        }
      });
      if (oldMembershipId && oldMembershipId !== newMembership?.id) await recalculateMembershipPaid(oldMembershipId);
      if (newMembership?.id) await recalculateMembershipPaid(newMembership.id);
    }

    if (operation === 'deletePayment') {
      const id = encodeURIComponent(String(body.id || ''));
      const rows = await select('payments', `id=eq.${id}&gym_id=eq.${gymFilter}&select=*&limit=1`);
      if (!rows[0]) return Response.json({ error: 'Payment not found' }, { status: 404 });
      const payment = rows[0];
      await request(`payments?id=eq.${id}&gym_id=eq.${gymFilter}`, { method: 'DELETE' });
      await audit('payment.deleted', payment.id, {
        member_id: payment.member_id,
        membership_id: payment.membership_id || null,
        amount: Number(payment.amount || 0),
        method: payment.method || '',
        paid_at: payment.paid_at || null,
        reference: payment.reference || null
      });
      if (payment.membership_id) await recalculateMembershipPaid(payment.membership_id);
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
        const owned = await select('membership_plans', `id=eq.${id}&gym_id=eq.${gymFilter}&select=id,name,price,duration_months&limit=1`);
        if (!owned[0]) return Response.json({ error: 'Membership plan not found' }, { status: 404 });
        // Membership history references plan_id. Changing a used plan would
        // silently rewrite the meaning of historical memberships, so used
        // plans are immutable. Create a new plan for a new price/name instead.
        const used = await select('memberships', `plan_id=eq.${id}&gym_id=eq.${gymFilter}&select=id&limit=1`);
        if (used[0] && (String(owned[0].name) !== name || Number(owned[0].price) !== price || Number(owned[0].duration_months) !== durationMonths)) {
          return Response.json({ error: 'This plan is already used by membership history. Create a new plan instead of changing its name, price or duration.' }, { status: 409 });
        }
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

    const [members, memberships, plans, payments, trainers] = await Promise.all([
      select('members', `gym_id=eq.${gymFilter}&select=*&order=created_at.desc`),
      select('memberships', `gym_id=eq.${gymFilter}&select=*&order=created_at.desc`),
      select('membership_plans', `gym_id=eq.${gymFilter}&select=*`),
      select('payments', `gym_id=eq.${gymFilter}&select=*&order=paid_at.desc`),
      (access.role === 'owner' || access.permissions.includes('trainers.read'))
        ? select('trainers', `gym_id=eq.${gymFilter}&select=id,status`)
        : Promise.resolve([])
    ]);
    const titleCase = (value: string) => value.split(' ').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    const result = members.map((member: any, index: number) => {
      const membership = memberships.find((item: any) => item.member_id === member.id);
      const plan = plans.find((item: any) => item.id === membership?.plan_id);
      const payment = payments.find((item: any) => item.member_id === member.id);
      let metadata: any = {};
      try { metadata = JSON.parse(member.notes || '{}'); } catch { metadata = { note: member.notes || '' }; }
      const status = lifecycleStatus(membership, member, metadata.status || titleCase(member.status || 'active'));
      const amountDue = Number(membership?.amount_due || plan?.price || 0);
      const amountPaid = Number(membership?.amount_paid || 0);
      const balance = metadata.balance_override !== undefined && metadata.balance_override >= 0 ? metadata.balance_override : Math.max(0, amountDue - amountPaid);
      const expiryDate = membership?.end_date || '';
      const expiredByDate = expiryDate && expiryDate < new Date().toISOString().slice(0, 10);
      const paymentStatus = amountDue > amountPaid ? ((status === 'Expired' || expiredByDate) ? 'Overdue' : 'Pending') : 'Paid';
      return { id: member.id, memberId: metadata.memberId || `GYM-${1001 + index}`, name: member.full_name, phone: member.phone, email: member.email || '', gender: metadata.gender || '', plan: plan?.name || 'Monthly', fee: amountDue, amountPaid, balance, balanceOverride: metadata.balance_override !== undefined ? metadata.balance_override : null, status, startDate: membership?.start_date || member.joined_at.slice(0,10), expiryDate, paymentStatus, paymentMethod: payment?.method ? titleCase(payment.method.replace(/_/g, ' ')) : 'Cash', registeredDate: member.joined_at.slice(0,10), gym: gym.name, note: metadata.note || '', preferredTime: metadata.preferredTime || 'Flexible', photoUrl: member.avatar_url || null, joinToken: metadata.joinToken || '', createdAt: member.created_at, updatedAt: member.updated_at };
    });
    const names = new Map(members.map((member: any) => [member.id, member.full_name]));
    const memberActivities = members.map((member: any) => ({ id: `member-${member.id}`, type: 'member', text: `${member.full_name} was added as a member`, occurredAt: member.created_at }));
    const paymentActivities = payments.map((payment: any) => ({ id: `payment-${payment.id}`, type: 'payment', text: `$${Number(payment.amount || 0).toLocaleString()} payment received from ${names.get(payment.member_id) || 'a member'}`, occurredAt: payment.paid_at || payment.created_at }));
    const updateActivities = members.filter((member: any) => member.updated_at && new Date(member.updated_at).getTime() - new Date(member.created_at).getTime() > 1000).map((member: any) => ({ id: `update-${member.id}`, type: 'update', text: `${member.full_name}'s profile was updated`, occurredAt: member.updated_at }));
    const recentActivities = [...memberActivities, ...paymentActivities, ...updateActivities].filter((item: any) => item.occurredAt).sort((a: any, b: any) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()).slice(0, 10);
    const lifecycleNotifications = memberships
      .map((membership: any) => {
        const member = members.find((item: any) => item.id === membership.member_id);
        if (!member || !membership.end_date) return null;
        const expiry = String(membership.end_date);
        const today = new Date().toISOString().slice(0, 10);
        const days = Math.floor((new Date(`${expiry}T00:00:00Z`).getTime() - new Date(`${today}T00:00:00Z`).getTime()) / 86400000);
        if (days === 5) return { key: 'expiry', title: 'Membership expires in 5 days', message: `${member.full_name} membership expires on ${expiry}` };
        if (days === 1) return { key: 'expiry', title: 'Membership expires tomorrow', message: `${member.full_name} membership expires on ${expiry}` };
        if (days === 0) return { key: 'expiry', title: 'Membership expires today', message: `${member.full_name} membership expires today` };
        if (days < 0) return { key: 'expired', title: 'Membership expired', message: `${member.full_name} membership expired on ${expiry}` };
        return null;
      })
      .filter(Boolean);
    if (access.role === 'owner' && lifecycleNotifications.length) {
      await Promise.all(lifecycleNotifications.map((item: any) => notifyOwnerOnce(item.key, item.title, item.message).catch(() => undefined)));
    }
    const analytics = {
      trainers: trainers.map((trainer: any) => ({ id: trainer.id, status: trainer.status || '' })),
      payments: readPayments ? payments.map((payment: any) => ({ id: payment.id, memberId: payment.member_id, membershipId: payment.membership_id || null, memberName: names.get(payment.member_id) || 'Unknown member', amount: Number(payment.amount || 0), method: payment.method || '', reference: payment.reference || '', note: payment.note || '', paidAt: payment.paid_at || payment.created_at })) : [],
      memberships: (access.role === 'owner' || access.permissions.includes('plans.read')) ? memberships.map((membership: any) => ({ id: membership.id, memberId: membership.member_id, planId: membership.plan_id, startDate: membership.start_date, endDate: membership.end_date, amountDue: Number(membership.amount_due || 0), amountPaid: Number(membership.amount_paid || 0), status: membership.status, createdAt: membership.created_at })) : [],
      plans: (access.role === 'owner' || access.permissions.includes('plans.read')) ? plans.map((plan: any) => ({ id: plan.id, name: plan.name, price: Number(plan.price || 0), duration: `${Number(plan.duration_months || 1)} ${Number(plan.duration_months || 1) === 1 ? 'month' : 'months'}`, status: plan.is_active ? 'Active' : 'Inactive', activeMembers: memberships.filter((membership: any) => membership.plan_id === plan.id && membership.status === 'active').length })) : [],
      recentActivities: access.role === 'owner' ? recentActivities : recentActivities.filter((item: any) => item.type === 'member')
    };
    const safeMembers = readMembers ? result.map((member: any) => {
      if (access.role === 'owner' || access.permissions.includes('members.write')) return member;
      return { id: member.id, memberId: member.memberId, name: member.name, phone: member.phone, status: member.status, plan: member.plan, expiryDate: member.expiryDate, registeredDate: member.registeredDate, gym: member.gym };
    }) : [];
    return Response.json({ members: safeMembers, analytics });
  } catch (error) {
    // Name the failed operation, not the raw error — same reasoning as
    // gymAccess: useful debugging signal without forwarding raw
    // database/Supabase error text that could leak schema details.
    return Response.json({ error: `Unable to complete ${operation || 'request'}` }, { status: 500 });
  }
}