-- ============================================================
-- Migration: Add selected_services column to form_submissions
-- Stores the services/procedures the patient selected in the widget
-- ============================================================

alter table public.form_submissions
  add column selected_services jsonb not null default '[]';
