-- ============================================================
-- Migration: Add webhook_format column to widget_configs
-- Allows tenants to choose a delivery format: generic (default), discord, slack
-- ============================================================

alter table public.widget_configs
  add column webhook_format text not null default 'generic'
  check (webhook_format in ('generic', 'discord', 'slack'));
