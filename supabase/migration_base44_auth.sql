-- ============================================================
-- GYMSYNC — Migration: Decouple staff table from Supabase auth
-- ============================================================
-- Run in: Supabase Dashboard → SQL Editor → New query.
-- This is idempotent and does not drop data.
--
-- Background: The app now uses Base44's built-in auth for all
-- authentication. Supabase is used only as the database. The
-- staff table's user_id column had a foreign key to
-- auth.users(id), which only contains Supabase auth users.
-- Base44 user IDs are not in that table, so the foreign key
-- must be removed to allow inserting staff records linked by
-- email instead.
-- ============================================================

-- 1. Drop the foreign key constraint on staff.user_id (if it exists)
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'staff' and constraint_type = 'FOREIGN KEY'
  ) then
    alter table public.staff drop constraint staff_user_id_fkey;
  end if;
end $$;

-- 2. Make user_id nullable (so we can insert staff without a Supabase user_id)
alter table public.staff alter column user_id drop not null;

-- 3. Add an email column for direct email-based identification
alter table public.staff add column if not exists email text;

-- Done. Staff records can now be created with email-based identification
-- instead of requiring a Supabase auth user_id.