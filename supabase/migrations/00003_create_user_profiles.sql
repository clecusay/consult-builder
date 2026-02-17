-- ============================================================
-- Migration: Create user_profiles table
-- ============================================================

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role text not null default 'center_staff' check (role in ('platform_admin', 'center_admin', 'center_staff')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_user_profiles_user on public.user_profiles (user_id);
create index idx_user_profiles_tenant on public.user_profiles (tenant_id);

alter table public.user_profiles enable row level security;

create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();
