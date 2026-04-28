-- Maps Clerk auth users -> SessionLens therapist_id.
--
-- One row per Clerk user. The `therapist_id` is the foreign key that
-- clients/sessions/audit_logs already use throughout the app, so wiring auth
-- is a matter of resolving clerk_user_id -> therapist_id.
--
-- Apply via Supabase dashboard SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id              uuid primary key default gen_random_uuid(),
  clerk_user_id   text unique not null,
  therapist_id    uuid unique not null default gen_random_uuid(),
  email           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index if not exists users_clerk_user_id_idx on public.users (clerk_user_id);
create index if not exists users_therapist_id_idx  on public.users (therapist_id);

-- RLS: users can only read their own row. Writes happen via service role
-- (webhook). Once we move other tables to RLS, we'll join them through this
-- mapping with auth.jwt() ->> 'sub' = clerk_user_id.
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (clerk_user_id = (auth.jwt() ->> 'sub'));
