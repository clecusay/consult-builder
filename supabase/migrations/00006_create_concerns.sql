-- ============================================================
-- Migration: Create concerns table
-- ============================================================

create table public.concerns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade, -- NULL = platform default
  body_region_id uuid not null references public.body_regions(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  unique (body_region_id, slug)
);

create index idx_concerns_region on public.concerns (body_region_id);
create index idx_concerns_tenant on public.concerns (tenant_id);

alter table public.concerns enable row level security;
