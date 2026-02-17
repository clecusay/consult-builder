-- ============================================================
-- Migration: Create body_regions table
-- ============================================================

create table public.body_regions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade, -- NULL = platform default
  name text not null,
  slug text not null,
  gender text not null default 'all' check (gender in ('female', 'male', 'all')),
  body_area text not null default 'body' check (body_area in ('face', 'body')),
  display_order integer not null default 0,
  hotspot_x real,
  hotspot_y real,
  diagram_view text check (diagram_view in ('front', 'back', 'face')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  -- Unique slug per tenant (or per platform defaults)
  unique (tenant_id, slug, gender)
);

create index idx_body_regions_tenant on public.body_regions (tenant_id);
create index idx_body_regions_defaults on public.body_regions (tenant_id) where tenant_id is null;

alter table public.body_regions enable row level security;
