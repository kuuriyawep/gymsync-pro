-- GymSync financial integrity: append-only payment allocations, atomic payment/renewal RPCs,
-- idempotent requests, overpayment protection, and single-source database audit triggers.
-- Existing payment rows are preserved. Legacy overpayments remain visible as unallocated
-- amounts in the reconciliation view; they are not silently deleted or refunded.

create table if not exists public.payment_allocations (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists payment_allocations_member_idx
  on public.payment_allocations(gym_id, member_id, membership_id);
create index if not exists payment_allocations_payment_idx
  on public.payment_allocations(payment_id);

alter table public.payment_allocations enable row level security;
revoke all on public.payment_allocations from public, anon, authenticated;
grant all on public.payment_allocations to service_role;

create table if not exists private.financial_operation_requests (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  idempotency_key text not null,
  operation text not null check (operation in ('record_payment','renew_membership')),
  request_payload jsonb not null,
  response_payload jsonb,
  created_at timestamptz not null default now(),
  unique (gym_id, idempotency_key)
);
alter table private.financial_operation_requests enable row level security;
revoke all on private.financial_operation_requests from public, anon, authenticated;

-- Preserve every legacy payment. Allocate only the amount that was actually due
-- on its linked membership; any historical excess remains visible as unallocated.
with ordered_payments as (
  select p.id payment_id, p.gym_id, p.member_id, p.membership_id, p.amount,
         m.amount_due,
         coalesce(sum(p.amount) over (
           partition by p.membership_id
           order by p.paid_at, p.created_at, p.id
           rows between unbounded preceding and 1 preceding
         ), 0) prior_paid
  from public.payments p
  join public.memberships m on m.id = p.membership_id
  where p.membership_id is not null
), allocation_rows as (
  select payment_id, gym_id, member_id, membership_id,
         least(amount, greatest(amount_due - prior_paid, 0)) allocated
  from ordered_payments
)
insert into public.payment_allocations(gym_id, member_id, payment_id, membership_id, amount)
select gym_id, member_id, payment_id, membership_id, allocated
from allocation_rows
where allocated > 0
on conflict do nothing;

update public.memberships m
set amount_paid = coalesce((
  select sum(a.amount)
  from public.payment_allocations a
  where a.membership_id = m.id
), 0);

create or replace view public.payment_reconciliation as
select
  p.id as payment_id,
  p.gym_id,
  p.member_id,
  p.membership_id,
  p.amount as payment_amount,
  coalesce(sum(a.amount), 0)::numeric(12,2) as allocated_amount,
  greatest(p.amount - coalesce(sum(a.amount), 0), 0)::numeric(12,2) as unallocated_amount,
  p.method,
  p.paid_at
from public.payments p
left join public.payment_allocations a on a.payment_id = p.id
group by p.id, p.gym_id, p.member_id, p.membership_id, p.amount, p.method, p.paid_at;

revoke all on public.payment_reconciliation from public, anon, authenticated;
grant select on public.payment_reconciliation to service_role;

create or replace function private.allocate_payment(p_payment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
  v_membership record;
  v_remaining numeric(12,2);
  v_balance numeric(12,2);
  v_allocation numeric(12,2);
begin
  select * into v_payment
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;

  delete from public.payment_allocations where payment_id = p_payment_id;
  v_remaining := round(v_payment.amount, 2);

  for v_membership in
    select id, amount_due, amount_paid
    from public.memberships
    where gym_id = v_payment.gym_id
      and member_id = v_payment.member_id
    order by start_date, created_at, id
    for update
  loop
    exit when v_remaining <= 0;
    v_balance := greatest(round(v_membership.amount_due - v_membership.amount_paid, 2), 0);
    if v_balance <= 0 then
      continue;
    end if;

    v_allocation := least(v_remaining, v_balance);
    insert into public.payment_allocations(gym_id, member_id, payment_id, membership_id, amount)
    values (v_payment.gym_id, v_payment.member_id, p_payment_id, v_membership.id, v_allocation);

    update public.memberships
    set amount_paid = round(amount_paid + v_allocation, 2)
    where id = v_membership.id;

    v_remaining := round(v_remaining - v_allocation, 2);
  end loop;

  if v_remaining > 0 then
    raise exception 'Payment exceeds the member total outstanding balance by $%', v_remaining
      using errcode = '22023';
  end if;
end;
$function$;

create or replace function public.gym_record_payment(
  p_gym_id uuid,
  p_member_id uuid,
  p_amount numeric,
  p_method text,
  p_paid_at timestamptz,
  p_note text,
  p_idempotency_key text,
  p_recorded_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payload jsonb;
  v_request private.financial_operation_requests%rowtype;
  v_member public.members%rowtype;
  v_membership_id uuid;
  v_outstanding numeric(12,2);
  v_payment public.payments%rowtype;
  v_method text;
  v_response jsonb;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    raise exception 'Payment amount must be a positive value with at most two decimals' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 or length(p_idempotency_key) > 128 then
    raise exception 'A valid idempotency key is required' using errcode = '22023';
  end if;
  v_method := lower(replace(trim(coalesce(p_method, 'cash')), ' ', '_'));
  if v_method not in ('cash','card','mobile_money','bank_transfer') then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  v_payload := jsonb_build_object(
    'member_id', p_member_id, 'amount', round(p_amount,2), 'method', v_method,
    'paid_at', coalesce(p_paid_at, now()), 'note', left(coalesce(p_note,''),500)
  );

  insert into private.financial_operation_requests(gym_id,idempotency_key,operation,request_payload)
  values (p_gym_id,p_idempotency_key,'record_payment',v_payload)
  on conflict (gym_id,idempotency_key) do nothing;

  select * into v_request
  from private.financial_operation_requests
  where gym_id=p_gym_id and idempotency_key=p_idempotency_key
  for update;

  if v_request.request_payload <> v_payload or v_request.operation <> 'record_payment' then
    raise exception 'Idempotency key was already used for a different request' using errcode = '23505';
  end if;
  if v_request.response_payload is not null then
    return v_request.response_payload || jsonb_build_object('replayed', true);
  end if;

  select * into v_member
  from public.members
  where id=p_member_id and gym_id=p_gym_id
  for update;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  perform id
  from public.memberships
  where gym_id=p_gym_id and member_id=p_member_id
  order by start_date, created_at, id
  for update;

  select coalesce(sum(greatest(amount_due - amount_paid, 0)),0)::numeric(12,2)
  into v_outstanding
  from public.memberships
  where gym_id=p_gym_id and member_id=p_member_id;

  if v_outstanding <= 0 then
    raise exception 'This member has no outstanding balance. No additional payment can be recorded.' using errcode = '22023';
  end if;
  if p_amount > v_outstanding then
    raise exception 'Payment exceeds the total outstanding balance of $%', v_outstanding using errcode = '22023';
  end if;

  select id into v_membership_id
  from public.memberships
  where gym_id=p_gym_id and member_id=p_member_id and amount_due > amount_paid
  order by start_date, created_at, id
  limit 1;

  insert into public.payments(gym_id,member_id,membership_id,amount,method,reference,note,paid_at,recorded_by)
  values (
    p_gym_id,p_member_id,v_membership_id,round(p_amount,2),v_method,
    'TXN-' || replace(gen_random_uuid()::text,'-',''),
    left(coalesce(p_note,''),500),coalesce(p_paid_at,now()),p_recorded_by
  )
  returning * into v_payment;

  perform private.allocate_payment(v_payment.id);

  v_response := jsonb_build_object(
    'success',true,'payment_id',v_payment.id,'member_id',p_member_id,
    'amount',v_payment.amount,'outstanding_before',v_outstanding,
    'outstanding_after',v_outstanding-v_payment.amount,'replayed',false
  );

  update private.financial_operation_requests
  set response_payload=v_response
  where id=v_request.id;

  return v_response;
end;
$function$;

create or replace function public.gym_renew_membership(
  p_gym_id uuid,
  p_member_id uuid,
  p_plan_id uuid,
  p_start_date date,
  p_end_date date,
  p_amount numeric,
  p_method text,
  p_paid_at timestamptz,
  p_note text,
  p_idempotency_key text,
  p_recorded_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payload jsonb;
  v_request private.financial_operation_requests%rowtype;
  v_member public.members%rowtype;
  v_plan public.membership_plans%rowtype;
  v_previous_debt numeric(12,2);
  v_maximum numeric(12,2);
  v_method text;
  v_membership public.memberships%rowtype;
  v_payment public.payments%rowtype;
  v_response jsonb;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount < 0 or p_amount <> round(p_amount,2) then
    raise exception 'Renewal payment must be zero or a positive amount with at most two decimals' using errcode = '22023';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 or length(p_idempotency_key) > 128 then
    raise exception 'A valid idempotency key is required' using errcode = '22023';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'A valid membership start and end date are required' using errcode = '22023';
  end if;
  v_method := lower(replace(trim(coalesce(p_method, 'cash')), ' ', '_'));
  if v_method not in ('cash','card','mobile_money','bank_transfer') then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  v_payload := jsonb_build_object(
    'member_id',p_member_id,'plan_id',p_plan_id,'start_date',p_start_date,
    'end_date',p_end_date,'amount',round(p_amount,2),'method',v_method,
    'paid_at',coalesce(p_paid_at,now()),'note',left(coalesce(p_note,''),500)
  );

  insert into private.financial_operation_requests(gym_id,idempotency_key,operation,request_payload)
  values (p_gym_id,p_idempotency_key,'renew_membership',v_payload)
  on conflict (gym_id,idempotency_key) do nothing;

  select * into v_request
  from private.financial_operation_requests
  where gym_id=p_gym_id and idempotency_key=p_idempotency_key
  for update;

  if v_request.request_payload <> v_payload or v_request.operation <> 'renew_membership' then
    raise exception 'Idempotency key was already used for a different request' using errcode = '23505';
  end if;
  if v_request.response_payload is not null then
    return v_request.response_payload || jsonb_build_object('replayed',true);
  end if;

  select * into v_member
  from public.members
  where id=p_member_id and gym_id=p_gym_id
  for update;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  select * into v_plan
  from public.membership_plans
  where id=p_plan_id and gym_id=p_gym_id and is_active=true
  for share;
  if not found then
    raise exception 'Active membership plan not found' using errcode = 'P0002';
  end if;

  perform id
  from public.memberships
  where gym_id=p_gym_id and member_id=p_member_id
  order by start_date, created_at, id
  for update;

  if exists (
    select 1 from public.memberships
    where gym_id=p_gym_id and member_id=p_member_id
      and start_date=p_start_date and end_date=p_end_date
  ) then
    raise exception 'This membership period already exists. Refresh the member record before retrying.' using errcode = '23505';
  end if;

  select coalesce(sum(greatest(amount_due - amount_paid,0)),0)::numeric(12,2)
  into v_previous_debt
  from public.memberships
  where gym_id=p_gym_id and member_id=p_member_id;

  v_maximum := round(v_previous_debt + v_plan.price,2);
  if p_amount > v_maximum then
    raise exception 'Payment exceeds previous debt plus the new membership fee ($%)', v_maximum using errcode = '22023';
  end if;

  -- If the entire payment is consumed by old debt, settle that debt only.
  -- Do not create a new membership until some amount is available for its fee.
  if v_previous_debt > 0 and p_amount <= v_previous_debt then
    if p_amount > 0 then
      select id into v_membership.id
      from public.memberships
      where gym_id=p_gym_id and member_id=p_member_id and amount_due > amount_paid
      order by start_date, created_at, id
      limit 1;

      insert into public.payments(gym_id,member_id,membership_id,amount,method,reference,note,paid_at,recorded_by)
      values (
        p_gym_id,p_member_id,v_membership.id,round(p_amount,2),v_method,
        'TXN-' || replace(gen_random_uuid()::text,'-',''),
        left(coalesce(p_note,''),500),coalesce(p_paid_at,now()),p_recorded_by
      )
      returning * into v_payment;

      perform private.allocate_payment(v_payment.id);
    end if;

    v_response := jsonb_build_object(
      'success',true,'renewal_created',false,'reason','previous_debt_only',
      'member_id',p_member_id,'previous_debt_before',v_previous_debt,
      'payment_amount',round(p_amount,2),
      'previous_debt_after',greatest(v_previous_debt-round(p_amount,2),0),
      'new_membership_id',null,'payment_id',v_payment.id
    );
  else
    insert into public.memberships(gym_id,member_id,plan_id,start_date,end_date,amount_due,amount_paid,status)
    values (p_gym_id,p_member_id,p_plan_id,p_start_date,p_end_date,v_plan.price,0,'active')
    returning * into v_membership;

    if p_amount > 0 then
      insert into public.payments(gym_id,member_id,membership_id,amount,method,reference,note,paid_at,recorded_by)
      values (
        p_gym_id,p_member_id,v_membership.id,round(p_amount,2),v_method,
        'TXN-' || replace(gen_random_uuid()::text,'-',''),
        left(coalesce(p_note,''),500),coalesce(p_paid_at,now()),p_recorded_by
      )
      returning * into v_payment;

      perform private.allocate_payment(v_payment.id);
    end if;

    v_response := jsonb_build_object(
      'success',true,'renewal_created',true,'member_id',p_member_id,
      'new_membership_id',v_membership.id,'plan_id',p_plan_id,
      'fee',v_plan.price,'previous_debt_before',v_previous_debt,
      'payment_amount',round(p_amount,2),
      'new_membership_paid',greatest(round(p_amount-v_previous_debt,2),0),
      'new_membership_balance',greatest(round(v_plan.price-greatest(p_amount-v_previous_debt,0),2),0),
      'payment_id',v_payment.id
    );
  end if;

  update private.financial_operation_requests
  set response_payload=v_response
  where id=v_request.id;

  return v_response;
end;
$function$;

-- Payment edits/deletes remain allocation-aware and atomic.
create or replace function public.gym_update_payment(
  p_gym_id uuid, p_payment_id uuid, p_amount numeric, p_method text,
  p_paid_at timestamptz, p_note text, p_recorded_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
  v_method text;
  v_outstanding numeric(12,2);
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount,2) or p_paid_at is null then
    raise exception 'Valid payment amount and date are required' using errcode = '22023';
  end if;
  v_method := lower(replace(trim(coalesce(p_method,'cash')),' ','_'));
  if v_method not in ('cash','card','mobile_money','bank_transfer') then
    raise exception 'Unsupported payment method' using errcode = '22023';
  end if;

  select * into v_payment from public.payments
  where id=p_payment_id and gym_id=p_gym_id for update;
  if not found then raise exception 'Payment not found' using errcode = 'P0002'; end if;

  perform id from public.memberships
  where gym_id=p_gym_id and member_id=v_payment.member_id
  order by start_date,created_at,id for update;

  delete from public.payment_allocations where payment_id=p_payment_id;
  update public.memberships m
  set amount_paid=coalesce((
    select sum(a.amount) from public.payment_allocations a where a.membership_id=m.id
  ),0)
  where m.gym_id=p_gym_id and m.member_id=v_payment.member_id;

  select coalesce(sum(greatest(amount_due-amount_paid,0)),0)::numeric(12,2)
  into v_outstanding
  from public.memberships
  where gym_id=p_gym_id and member_id=v_payment.member_id;

  if p_amount > v_outstanding then
    raise exception 'Updated payment exceeds the available outstanding balance of $%',v_outstanding using errcode='22023';
  end if;

  update public.payments
  set amount=round(p_amount,2),method=v_method,paid_at=p_paid_at,
      note=left(coalesce(p_note,''),500),recorded_by=coalesce(p_recorded_by,recorded_by)
  where id=p_payment_id
  returning * into v_payment;

  perform private.allocate_payment(p_payment_id);

  return jsonb_build_object('success',true,'payment_id',p_payment_id,'amount',v_payment.amount);
end;
$function$;

create or replace function public.gym_delete_payment(p_gym_id uuid, p_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_payment public.payments%rowtype;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;

  select * into v_payment from public.payments
  where id=p_payment_id and gym_id=p_gym_id for update;
  if not found then raise exception 'Payment not found' using errcode = 'P0002'; end if;

  perform id from public.memberships
  where gym_id=p_gym_id and member_id=v_payment.member_id
  order by start_date,created_at,id for update;

  delete from public.payment_allocations where payment_id=p_payment_id;
  delete from public.payments where id=p_payment_id;

  update public.memberships m
  set amount_paid=coalesce((
    select sum(a.amount) from public.payment_allocations a where a.membership_id=m.id
  ),0)
  where m.gym_id=p_gym_id and m.member_id=v_payment.member_id;

  return jsonb_build_object('success',true,'payment_id',p_payment_id,'deleted_amount',v_payment.amount);
end;
$function$;

revoke all on function public.gym_record_payment(uuid,uuid,numeric,text,timestamptz,text,text,uuid) from public, anon, authenticated;
revoke all on function public.gym_renew_membership(uuid,uuid,uuid,date,date,numeric,text,timestamptz,text,text,uuid) from public, anon, authenticated;
revoke all on function public.gym_update_payment(uuid,uuid,numeric,text,timestamptz,text,uuid) from public, anon, authenticated;
revoke all on function public.gym_delete_payment(uuid,uuid) from public, anon, authenticated;
grant execute on function public.gym_record_payment(uuid,uuid,numeric,text,timestamptz,text,text,uuid) to service_role;
grant execute on function public.gym_renew_membership(uuid,uuid,uuid,date,date,numeric,text,timestamptz,text,text,uuid) to service_role;
grant execute on function public.gym_update_payment(uuid,uuid,numeric,text,timestamptz,text,uuid) to service_role;
grant execute on function public.gym_delete_payment(uuid,uuid) to service_role;

-- Keep the hardened private audit trigger as the sole audit writer for these
-- three financial tables; the older public trigger was writing a second row.
drop trigger if exists audit_members_changes on public.members;
drop trigger if exists audit_memberships_changes on public.memberships;
drop trigger if exists audit_payments_changes on public.payments;

-- Event-trigger functions must not be callable as ordinary client RPCs.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

comment on table public.payment_allocations is
  'Immutable allocation ledger: records exactly which membership obligation each received payment settles.';
comment on view public.payment_reconciliation is
  'Reconciles received payment totals against allocations; historical unallocated amounts require owner review.';
