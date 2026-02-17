-- ============================================================
-- Migration: Create tenants table + shared trigger function
-- ============================================================

-- Updated_at trigger function (used by multiple tables)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  stripe_customer_id text,
  stripe_subscription_id text,
  billing_plan text not null default 'free' check (billing_plan in ('free', 'starter', 'professional', 'enterprise')),
  billing_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for slug lookups (widget config fetches)
create index idx_tenants_slug on public.tenants (slug);

-- RLS enabled (policies added after user_profiles table exists)
alter table public.tenants enable row level security;

create trigger set_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();
