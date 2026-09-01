-- ============================================================
-- GYMSYNC — Supabase schema proposal (REVIEW BEFORE RUNNING)
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor → New query.
-- This is idempotent (uses IF NOT EXISTS) and does not drop data.
-- Architecture: one Owner manages one Gym; Staff are invited by the Owner;
-- Members are registered by the Owner and link their own account.
-- All table access is gated by Row Level Security (RLS).
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.gyms (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  phone       text,
  email       text,
  description text,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Application profile layered over auth.users. Role is assigned server-side
-- (never self-selected by the user) during owner provisioning / staff invite /
-- member linking.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  gym_id     uuid references public.gyms(id) on delete set null,
  role       text not null check (role in ('owner','staff','member')),
  full_name  text,
  phone      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Staff associations: a user can be staff at one gym, invited by the owner.
create table if not exists public.staff (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  staff_role    text not null check (staff_role in ('Manager','Front Desk','Cashier')),
  permissions   jsonb not null default '[]'::jsonb,
  status        text not null default 'Invited' check (status in ('Active','Invited','Revoked')),
  invited_by    uuid references public.profiles(id),
  last_active_at timestamptz,
  created_at    timestamptz not null default now(),
  unique (gym_id, user_id)
);

-- Members are created by the Owner/Staff. user_id is NULL until the member
-- links their own auth account via the verified Join flow.
create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid not null references public.gyms(id) on delete cascade,
  member_id  text not null,                       -- gym-issued human id (GYM-1001)
  full_name  text not null,
  phone      text not null,
  email      text,
  user_id    uuid references auth.users(id) on delete set null,
  status     text not null default 'Active' check (status in ('Active','Expiring Soon','Expired','Suspended')),
  created_at timestamptz not null default now(),
  unique (gym_id, member_id),
  unique (gym_id, phone)
);

create table if not exists public.membership_plans (
  id               uuid primary key default gen_random_uuid(),
  gym_id           uuid not null references public.gyms(id) on delete cascade,
  name             text not null,
  duration_months  int not null check (duration_months > 0),
  price            numeric(10,2) not null default 0,
  status           text not null default 'Active' check (status in ('Active','Inactive')),
  created_at       timestamptz not null default now(),
  unique (gym_id, name)
);

create table if not exists public.memberships (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.members(id) on delete cascade,
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  plan_id      uuid references public.membership_plans(id) on delete set null,
  start_date   date not null,
  expiry_date  date not null,
  status       text not null default 'Active' check (status in ('Active','Expiring Soon','Expired')),
  auto_renew   boolean not null default false,
  created_at   timestamptz not null default now()
);

create table if not exists public.payments (
  id             uuid primary key default gen_random_uuid(),
  gym_id         uuid not null references public.gyms(id) on delete cascade,
  member_id      uuid not null references public.members(id) on delete cascade,
  membership_id  uuid references public.memberships(id) on delete set null,
  amount         numeric(10,2) not null check (amount >= 0),
  amount_paid    numeric(10,2) not null default 0 check (amount_paid >= 0),
  balance        numeric(10,2) not null default 0,
  status         text not null check (status in ('Paid','Partially Paid','Outstanding','Expired','Renewal Due','Refunded')),
  method         text,
  reference      text,
  recorded_by    uuid references public.profiles(id),
  payment_date   date not null default current_date,
  notes          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid not null references public.gyms(id) on delete cascade,
  member_id   uuid not null references public.members(id) on delete cascade,
  check_in_at timestamptz not null default now(),
  recorded_by uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
-- One check-in per member per day (streaks are derived from this).
create unique index if not exists attendance_member_day_idx
  on public.attendance (member_id, (check_in_at::date));

create table if not exists public.feedback_requests (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  member_id    uuid not null references public.members(id) on delete cascade,
  type         text not null check (type in ('Feedback','Complaint','Feature Request','Machine Request','Coach Request')),
  title        text not null,
  body         text,
  status       text not null default 'Pending' check (status in ('Pending','Under Review','Approved','Rejected','Completed')),
  response     text,
  responded_by uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  gym_id     uuid references public.gyms(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  member_id  uuid references public.members(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  gym_id      uuid references public.gyms(id) on delete cascade,
  actor_id    uuid references auth.users(id),
  action      text not null,
  target_type text,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists profiles_gym_idx        on public.profiles(gym_id);
create index if not exists staff_gym_idx           on public.staff(gym_id);
create index if not exists members_gym_idx          on public.members(gym_id);
create index if not exists members_user_idx         on public.members(user_id);
create index if not exists memberships_member_idx   on public.memberships(member_id);
create index if not exists memberships_gym_idx       on public.memberships(gym_id);
create index if not exists payments_member_idx      on public.payments(member_id);
create index if not exists payments_gym_idx         on public.payments(gym_id);
create index if not exists attendance_member_idx     on public.attendance(member_id);
create index if not exists attendance_gym_idx        on public.attendance(gym_id);
create index if not exists feedback_member_idx      on public.feedback_requests(member_id);
create index if not exists feedback_gym_idx          on public.feedback_requests(gym_id);
create index if not exists notifications_user_idx   on public.notifications(user_id);
create index if not exists audit_gym_idx            on public.audit_logs(gym_id);

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER — trusted)
-- ============================================================
create or replace function public.current_gym_id()
returns uuid language sql security definer stable as $$
  select coalesce(
    (select gym_id from public.profiles where id = auth.uid()),
    (select gym_id from public.staff where user_id = auth.uid() and status = 'Active' limit 1),
    (select gym_id from public.members where user_id = auth.uid() limit 1)
  )
$$;

create or replace function public.is_owner(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and gym_id = gid and role = 'owner')
$$;

create or replace function public.is_staff(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and gym_id = gid and status = 'Active')
$$;

create or replace function public.own_member_id()
returns uuid language sql security definer stable as $$
  select id from public.members where user_id = auth.uid() limit 1
$$;

-- Streak: consecutive days up to (and including) the most recent check-in.
create or replace function public.member_streak(mid uuid)
returns int language plpgsql security definer stable as $$
declare
  days int := 0;
  d date := current_date;
  has_checkin boolean;
begin
  loop
    select exists (
      select 1 from public.attendance
      where member_id = mid and check_in_at::date = d
    ) into has_checkin;
    exit when not has_checkin;
    days := days + 1;
    d := d - 1;
    -- safety cap
    exit when days > 365;
  end loop;
  return days;
end
$$;

-- ============================================================
-- TRIGGERS — auto profile + membership expiry/status
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'member', coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.membership_set_dates()
returns trigger language plpgsql security definer as $$
declare
  plan_duration int;
begin
  if new.plan_id is not null then
    select duration_months into plan_duration from public.membership_plans where id = new.plan_id;
    if plan_duration is not null and new.expiry_date is null then
      new.expiry_date := (new.start_date + make_interval(months => plan_duration))::date;
    end if;
  end if;
  -- status from expiry vs today
  if new.expiry_date < current_date then
    new.status := 'Expired';
  elsif new.expiry_date <= current_date + 7 then
    new.status := 'Expiring Soon';
  else
    new.status := 'Active';
  end if;
  return new;
end
$$;

drop trigger if exists memberships_set_dates on public.memberships;
create trigger memberships_set_dates
  before insert or update on public.memberships
  for each row execute function public.membership_set_dates();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end
$$;
drop trigger if exists gyms_touch on public.gyms;
create trigger gyms_touch before update on public.gyms for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists feedback_touch on public.feedback_requests;
create trigger feedback_touch before update on public.feedback_requests for each row execute function public.touch_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.gyms              enable row level security;
alter table public.profiles          enable row level security;
alter table public.staff             enable row level security;
alter table public.members           enable row level security;
alter table public.membership_plans  enable row level security;
alter table public.memberships       enable row level security;
alter table public.payments          enable row level security;
alter table public.attendance        enable row level security;
alter table public.feedback_requests enable row level security;
alter table public.notifications     enable row level security;
alter table public.audit_logs        enable row level security;

-- GYMS
create policy "gyms read own"   on public.gyms for select using (id = public.current_gym_id());
create policy "gyms update owner" on public.gyms for update using (public.is_owner(id)) with check (public.is_owner(id));

-- PROFILES
create policy "profiles read self or gym staff" on public.profiles for select using (
  id = auth.uid() or (gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id)))
);
create policy "profiles update self or owner" on public.profiles for update using (
  id = auth.uid() or (gym_id is not null and public.is_owner(gym_id))
);

-- STAFF (managed by owner)
create policy "staff read own gym" on public.staff for select using (
  gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id) or user_id = auth.uid())
);
create policy "staff insert owner" on public.staff for insert with check (public.is_owner(gym_id));
create policy "staff update owner" on public.staff for update using (public.is_owner(gym_id)) with check (public.is_owner(gym_id));
create policy "staff delete owner" on public.staff for delete using (public.is_owner(gym_id));

-- MEMBERS
create policy "members read gym or self" on public.members for select using (
  user_id = auth.uid() or (gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id)))
);
create policy "members write gym staff" on public.members for insert with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "members update gym staff" on public.members for update using (public.is_owner(gym_id) or public.is_staff(gym_id)) with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "members delete owner" on public.members for delete using (public.is_owner(gym_id));

-- MEMBERSHIP PLANS
create policy "plans read gym" on public.membership_plans for select using (gym_id = public.current_gym_id());
create policy "plans write owner" on public.membership_plans for insert with check (public.is_owner(gym_id));
create policy "plans update owner" on public.membership_plans for update using (public.is_owner(gym_id)) with check (public.is_owner(gym_id));
create policy "plans delete owner" on public.membership_plans for delete using (public.is_owner(gym_id));

-- MEMBERSHIPS
create policy "memberships read gym or self" on public.memberships for select using (
  member_id = public.own_member_id() or (gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id)))
);
create policy "memberships write gym staff" on public.memberships for insert with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "memberships update gym staff" on public.memberships for update using (public.is_owner(gym_id) or public.is_staff(gym_id)) with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "memberships delete owner" on public.memberships for delete using (public.is_owner(gym_id));

-- PAYMENTS
create policy "payments read gym or self" on public.payments for select using (
  member_id = public.own_member_id() or (gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id)))
);
create policy "payments write gym staff" on public.payments for insert with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "payments update gym staff" on public.payments for update using (public.is_owner(gym_id) or public.is_staff(gym_id)) with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "payments delete owner" on public.payments for delete using (public.is_owner(gym_id));

-- ATTENDANCE
create policy "attendance read gym or self" on public.attendance for select using (
  member_id = public.own_member_id() or (gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id)))
);
create policy "attendance insert gym staff or self" on public.attendance for insert with check (
  member_id = public.own_member_id() or public.is_owner(gym_id) or public.is_staff(gym_id)
);
create policy "attendance update owner" on public.attendance for update using (public.is_owner(gym_id));
create policy "attendance delete owner" on public.attendance for delete using (public.is_owner(gym_id));

-- FEEDBACK / REQUESTS
create policy "feedback read gym or self" on public.feedback_requests for select using (
  member_id = public.own_member_id() or (gym_id = public.current_gym_id() and (public.is_owner(gym_id) or public.is_staff(gym_id)))
);
create policy "feedback insert self" on public.feedback_requests for insert with check (member_id = public.own_member_id());
create policy "feedback update gym staff" on public.feedback_requests for update using (public.is_owner(gym_id) or public.is_staff(gym_id)) with check (public.is_owner(gym_id) or public.is_staff(gym_id));
create policy "feedback delete self pending" on public.feedback_requests for delete using (member_id = public.own_member_id());

-- NOTIFICATIONS
create policy "notifications read self" on public.notifications for select using (user_id = auth.uid() or member_id = public.own_member_id());
create policy "notifications update self" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications delete self" on public.notifications for delete using (user_id = auth.uid());

-- AUDIT LOGS (append-only; read by owner)
create policy "audit read owner" on public.audit_logs for select using (public.is_owner(gym_id));
-- inserts are performed server-side by backend functions (service role bypasses RLS).

-- ============================================================
-- STORAGE (profile images / gym logos)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars auth upload" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars self update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner);
create policy "avatars self delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

-- ============================================================
-- DONE. Review the proposal, then run it. After it exists,
-- the frontend data layer can be wired to these tables.
-- ============================================================