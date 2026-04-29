-- ============================================================
-- Migration: Add success flow config (3-page post-submission)
-- ============================================================

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS success_flow_config jsonb;

COMMENT ON COLUMN public.widget_configs.success_flow_config IS
  'Three-page post-submission flow config: { thank_you: { heading, body }, doctor_profile: { heading, body, doctor_name }, calendar: { heading, calendar_url, calendar_embed_type } }';
