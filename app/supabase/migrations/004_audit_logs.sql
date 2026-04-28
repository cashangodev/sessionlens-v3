-- GDPR audit log — "who read what, when, from where".
--
-- Every read of a session's transcript or analysis result writes a row here.
-- This lets us answer Subject Access Requests ("show me everyone who has
-- looked at my data") and detect unusual access patterns later.
--
-- Schema kept narrow on purpose: action + resource + actor + when. Rich
-- request metadata (IP, user agent) is captured opportunistically when
-- available but not required.
--
-- Retention: indefinite for now. v2 adds a per-tenant retention policy.

create extension if not exists "pgcrypto";

create table if not exists public.audit_logs (
  id              bigserial primary key,
  occurred_at     timestamptz not null default now(),
  therapist_id    uuid not null,
  actor_clerk_id  text,
  action          text not null check (action in (
    'session.read',
    'session.export',
    'session.delete',
    'client.read',
    'client.update',
    'client.remove'
  )),
  resource_type   text not null,                 -- 'session' | 'client'
  resource_id     uuid,                          -- session_id or client_id
  client_code     text,                          -- denormalized for easy filtering
  ip              text,
  user_agent      text,
  metadata        jsonb default '{}'::jsonb
);

create index if not exists audit_logs_therapist_id_idx on public.audit_logs (therapist_id, occurred_at desc);
create index if not exists audit_logs_resource_idx     on public.audit_logs (resource_type, resource_id);
create index if not exists audit_logs_action_idx       on public.audit_logs (action, occurred_at desc);

-- RLS: therapists can only read their own audit rows. Inserts come from
-- service_role (server) which bypasses policies.
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_own" on public.audit_logs;
create policy "audit_logs_select_own"
  on public.audit_logs for select
  using (therapist_id = public.current_therapist_id());

comment on table public.audit_logs is
  'Append-only access log for GDPR Subject Access Requests. Service-role inserts only.';
