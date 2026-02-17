-- ============================================================
-- Migration: Create form_fields table
-- ============================================================

create table public.form_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  field_type text not null check (field_type in ('text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio')),
  label text not null,
  placeholder text,
  options jsonb, -- for select, radio, checkbox types
  is_required boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_form_fields_tenant on public.form_fields (tenant_id);

alter table public.form_fields enable row level security;
