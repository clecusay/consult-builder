-- ============================================================
-- Migration: Create widget_configs table
-- ============================================================

create table public.widget_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  primary_color text not null default '#1a1a2e',
  secondary_color text not null default '#16213e',
  accent_color text not null default '#0f3460',
  font_family text not null default 'system-ui, -apple-system, sans-serif',
  logo_url text,
  cta_text text not null default 'Book Your Consultation',
  success_message text not null default 'Thank you! We will be in touch shortly.',
  redirect_url text,
  webhook_url text,
  webhook_secret text,
  notification_emails text[] not null default '{}',
  allowed_origins text[] not null default '{}',
  custom_css text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.widget_configs enable row level security;

create trigger set_widget_configs_updated_at
  before update on public.widget_configs
  for each row execute function public.set_updated_at();
