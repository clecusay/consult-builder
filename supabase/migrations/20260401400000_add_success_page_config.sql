-- ============================================================
-- Migration: Add success page configuration fields
-- ============================================================

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS success_heading text NOT NULL DEFAULT 'Thank You!';

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS success_action_url text;

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS success_action_type text
  CHECK (success_action_type IN ('button', 'embed'));

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS success_action_label text NOT NULL DEFAULT 'Schedule Now';
