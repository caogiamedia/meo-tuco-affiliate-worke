-- AI Affiliate Worker: Supabase schema foundation
-- Apply in Supabase SQL Editor after creating a project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.ai_workers (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Affiliate Bot', mascot_key text not null default 'friendly-robot', status text not null default 'paused' check (status in ('active','paused','error')),
  autonomy_mode text not null default 'hybrid' check (autonomy_mode in ('manual','hybrid','autonomous')),
  daily_click_goal integer not null default 100, daily_content_goal integer not null default 3,
  timezone text not null default 'Asia/Ho_Chi_Minh', created_at timestamptz not null default now()
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, category text, description text, image_url text, price numeric(14,2), currency text not null default 'VND',
  source_url text not null, source_platform text not null default 'shopee', commission_rate numeric(7,4),
  status text not null default 'new' check (status in ('new','review','approved','promoting','paused','archived')),
  ai_score numeric(5,2), facts_verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null, original_url text not null, affiliate_url text not null,
  tracking_code text unique not null, network text not null default 'shopee', is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null, name text not null, objective text, audience text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed')), starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null, product_id uuid references public.products(id) on delete set null,
  channel text not null check (channel in ('website','facebook','tiktok','pinterest')), format text not null default 'post',
  title text, body text, media_urls text[] not null default '{}', affiliate_link_id uuid references public.affiliate_links(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','scheduled','published','rejected','failed')),
  scheduled_at timestamptz, published_at timestamptz, external_post_id text, created_at timestamptz not null default now()
);
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(), worker_id uuid not null references public.ai_workers(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade, task_type text not null, title text not null, input jsonb not null default '{}', output jsonb not null default '{}',
  status text not null default 'queued' check (status in ('queued','running','waiting_approval','completed','failed','cancelled')),
  priority integer not null default 5, scheduled_at timestamptz, started_at timestamptz, completed_at timestamptz, error text, created_at timestamptz not null default now()
);
create table if not exists public.agent_logs (
  id uuid primary key default gen_random_uuid(), worker_id uuid references public.ai_workers(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade, level text not null default 'info', event text not null, message text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  content_post_id uuid references public.content_posts(id) on delete cascade, action_type text not null, payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')), reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.traffic_events (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null, content_post_id uuid references public.content_posts(id) on delete set null,
  event_type text not null default 'click', source text, referrer text, anonymous_session_id text, country_code text,
  is_valid boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.affiliate_orders (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  affiliate_link_id uuid references public.affiliate_links(id) on delete set null, network_order_id text not null,
  order_status text not null, order_amount numeric(14,2), currency text not null default 'VND', reported_at timestamptz,
  source_payload jsonb not null default '{}', created_at timestamptz not null default now(), unique(owner_id, network_order_id)
);
create table if not exists public.commissions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.affiliate_orders(id) on delete set null, amount numeric(14,2) not null default 0, currency text not null default 'VND',
  status text not null check (status in ('estimated','confirmed','paid','reversed')), source_reference text, reported_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.channel_accounts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('facebook','tiktok','pinterest')), account_label text, external_account_id text,
  connection_status text not null default 'disconnected', token_secret_ref text, permissions jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  report_date date not null, clicks integer not null default 0, orders integer not null default 0,
  estimated_commission numeric(14,2) not null default 0, confirmed_commission numeric(14,2) not null default 0,
  paid_commission numeric(14,2) not null default 0, summary jsonb not null default '{}', created_at timestamptz not null default now(), unique(owner_id, report_date)
);
create table if not exists public.publishing_jobs (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  content_post_id uuid not null references public.content_posts(id) on delete cascade, channel text not null,
  scheduled_at timestamptz not null, status text not null default 'queued', attempts integer not null default 0, last_error text, created_at timestamptz not null default now()
);

-- Enable RLS and owner-scoped policies for all user-owned tables.
do $$ declare t text; begin
  foreach t in array array['ai_workers','products','affiliate_links','campaigns','content_posts','agent_tasks','agent_logs','approvals','traffic_events','affiliate_orders','commissions','channel_accounts','daily_reports','publishing_jobs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format('create policy owner_all on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;
alter table public.profiles enable row level security;
drop policy if exists profile_self on public.profiles;
create policy profile_self on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

create index if not exists idx_products_owner_status on public.products(owner_id,status);
create index if not exists idx_tasks_owner_status on public.agent_tasks(owner_id,status,scheduled_at);
create index if not exists idx_traffic_owner_date on public.traffic_events(owner_id,created_at desc);
create index if not exists idx_posts_owner_status on public.content_posts(owner_id,status,scheduled_at);
create index if not exists idx_commissions_owner_status on public.commissions(owner_id,status);

-- One primary worker per account for the first release.
create unique index if not exists idx_ai_workers_one_per_owner on public.ai_workers(owner_id);
create index if not exists idx_affiliate_links_tracking_code on public.affiliate_links(tracking_code);
create index if not exists idx_approvals_owner_status on public.approvals(owner_id,status,created_at desc);

-- Optional profile bootstrap trigger. The API also upserts the profile on first agent run.
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();
