-- ============================================================
-- Migration: Create tenant_locations table
-- ============================================================

create table public.tenant_locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_tenant_locations_tenant on public.tenant_locations (tenant_id);

alter table public.tenant_locations enable row level security;
