-- ============================================================
-- Migration: Create audit_logs table
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_tenant on public.audit_logs (tenant_id, created_at desc);
create index idx_audit_logs_user on public.audit_logs (user_id);

alter table public.audit_logs enable row level security;
