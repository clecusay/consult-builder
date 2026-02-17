-- ============================================================
-- Migration: Create form_submissions table
-- ============================================================

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  location_id uuid references public.tenant_locations(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  gender text not null default 'all' check (gender in ('female', 'male', 'all')),
  selected_regions jsonb not null default '[]',
  selected_concerns jsonb not null default '[]',
  custom_fields jsonb not null default '{}',
  source_url text,
  lead_status text not null default 'new' check (lead_status in ('new', 'contacted', 'scheduled', 'converted', 'lost')),
  notes text,
  webhook_status text check (webhook_status in ('pending', 'sent', 'failed')),
  webhook_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_form_submissions_tenant on public.form_submissions (tenant_id);
create index idx_form_submissions_status on public.form_submissions (tenant_id, lead_status);
create index idx_form_submissions_created on public.form_submissions (tenant_id, created_at desc);
create index idx_form_submissions_email on public.form_submissions (tenant_id, email);

alter table public.form_submissions enable row level security;

create trigger set_form_submissions_updated_at
  before update on public.form_submissions
  for each row execute function public.set_updated_at();
