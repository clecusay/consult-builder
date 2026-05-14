-- ============================================================
-- Migration: Allow embedding a third-party (e.g. GHL / aCRM)
-- form in place of the native one, so submissions go directly
-- to the provider (HIPAA: form data never touches our backend).
-- ============================================================

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS form_provider TEXT NOT NULL DEFAULT 'native',
  ADD COLUMN IF NOT EXISTS embed_form_url TEXT,
  ADD COLUMN IF NOT EXISTS embed_form_height INT NOT NULL DEFAULT 600;

ALTER TABLE public.widget_configs
  DROP CONSTRAINT IF EXISTS widget_configs_form_provider_check;

ALTER TABLE public.widget_configs
  ADD CONSTRAINT widget_configs_form_provider_check
  CHECK (form_provider IN ('native', 'embed'));

COMMENT ON COLUMN public.widget_configs.form_provider IS
  'Which form to render in the widget: ''native'' (built-in) or ''embed'' (third-party iframe).';
COMMENT ON COLUMN public.widget_configs.embed_form_url IS
  'When form_provider = ''embed'', the iframe URL of the third-party form (e.g. GHL LeadConnector form URL).';
COMMENT ON COLUMN public.widget_configs.embed_form_height IS
  'When form_provider = ''embed'', the iframe height in pixels.';
