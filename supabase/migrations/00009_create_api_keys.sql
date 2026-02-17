-- ============================================================
-- Migration: Create api_keys table
-- ============================================================

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null, -- first 8 chars for identification
  scopes text[] not null default '{}',
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_api_keys_tenant on public.api_keys (tenant_id);
create index idx_api_keys_prefix on public.api_keys (key_prefix);

alter table public.api_keys enable row level security;
