-- Inbound "request a demo" submissions from the public landing page.
-- These are not authenticated — anyone can submit. Service-role inserts only;
-- nobody can read except via Supabase dashboard.

create table if not exists public.demo_requests (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  name          text,
  email         text not null,
  organization  text,
  role          text,
  message       text,
  source        text,                          -- 'landing-hero' | 'landing-pricing' | etc
  ip            text,
  user_agent    text,
  status        text not null default 'new'    -- 'new' | 'contacted' | 'converted' | 'closed'
                check (status in ('new', 'contacted', 'converted', 'closed'))
);

create index if not exists demo_requests_created_at_idx
  on public.demo_requests (created_at desc);
create index if not exists demo_requests_status_idx
  on public.demo_requests (status);
create index if not exists demo_requests_email_idx
  on public.demo_requests (email);

-- RLS on, but no policies for anon/authenticated → only service_role can read/write.
alter table public.demo_requests enable row level security;
