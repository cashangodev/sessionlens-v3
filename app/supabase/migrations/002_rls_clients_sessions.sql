-- Row-level security for multi-tenant isolation.
--
-- Threat model: even if a code bug forgets to filter by `therapist_id`, the
-- database itself must refuse to leak one therapist's clients/sessions to
-- another therapist. RLS is the safety net.
--
-- Access pattern after this migration:
--
--   service_role (server-side, key kept in SUPABASE_SERVICE_ROLE_KEY env)
--     -> bypasses RLS by default (Supabase built-in). All app server code
--        uses this — and is responsible for filtering by therapist_id.
--
--   authenticated / anon (anyone with an anon key)
--     -> may only read/write rows where `therapist_id` matches the row in
--        public.users where clerk_user_id = auth.jwt() ->> 'sub'.
--        This protects against:
--          - the anon key leaking (it can no longer dump all clients)
--          - a future browser-direct query path going wrong
--
-- After this runs, the app MUST use the service role key on the server, OR
-- attach a Clerk-issued Supabase JWT to every Supabase request.

alter table public.clients  enable row level security;
alter table public.sessions enable row level security;

-- Helper: resolve the current Clerk user's therapist_id from the JWT.
-- Returns NULL when unauthenticated (which causes policies to fail closed).
create or replace function public.current_therapist_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select therapist_id
  from public.users
  where clerk_user_id = (auth.jwt() ->> 'sub')
    and deleted_at is null
  limit 1;
$$;

grant execute on function public.current_therapist_id() to anon, authenticated;

-- ─── clients ───
drop policy if exists "clients_select_own"  on public.clients;
drop policy if exists "clients_insert_own"  on public.clients;
drop policy if exists "clients_update_own"  on public.clients;
drop policy if exists "clients_delete_own"  on public.clients;

create policy "clients_select_own"
  on public.clients for select
  using (therapist_id = public.current_therapist_id());

create policy "clients_insert_own"
  on public.clients for insert
  with check (therapist_id = public.current_therapist_id());

create policy "clients_update_own"
  on public.clients for update
  using (therapist_id = public.current_therapist_id())
  with check (therapist_id = public.current_therapist_id());

create policy "clients_delete_own"
  on public.clients for delete
  using (therapist_id = public.current_therapist_id());

-- ─── sessions ───
drop policy if exists "sessions_select_own"  on public.sessions;
drop policy if exists "sessions_insert_own"  on public.sessions;
drop policy if exists "sessions_update_own"  on public.sessions;
drop policy if exists "sessions_delete_own"  on public.sessions;

create policy "sessions_select_own"
  on public.sessions for select
  using (therapist_id = public.current_therapist_id());

create policy "sessions_insert_own"
  on public.sessions for insert
  with check (therapist_id = public.current_therapist_id());

create policy "sessions_update_own"
  on public.sessions for update
  using (therapist_id = public.current_therapist_id())
  with check (therapist_id = public.current_therapist_id());

create policy "sessions_delete_own"
  on public.sessions for delete
  using (therapist_id = public.current_therapist_id());

-- ─── corpus tables stay public-read ───
-- lived_experiences, moments, practitioner_methods are the shared research
-- corpus that every therapist matches against. They have NO therapist_id
-- column and are intentionally readable by all authenticated users.
-- We don't enable RLS on them; if you want belt-and-suspenders later, enable
-- RLS and add a `for select to anon, authenticated using (true)` policy.
