-- ============================================================
-- Migration: Allow native form submissions to POST directly from
-- the visitor's browser to a third-party CRM webhook, bypassing
-- our backend entirely. PHI never touches our infrastructure;
-- our hosting role for these tenants becomes "static JS CDN."
-- ============================================================

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS submission_target TEXT NOT NULL DEFAULT 'backend',
  ADD COLUMN IF NOT EXISTS crm_webhook_url TEXT;

ALTER TABLE public.widget_configs
  DROP CONSTRAINT IF EXISTS widget_configs_submission_target_check;

ALTER TABLE public.widget_configs
  ADD CONSTRAINT widget_configs_submission_target_check
  CHECK (submission_target IN ('backend', 'webhook_direct'));

COMMENT ON COLUMN public.widget_configs.submission_target IS
  'Where the native form posts to: ''backend'' (our /api/widget/submit) or ''webhook_direct'' (the visitor''s browser POSTs straight to crm_webhook_url, our backend never sees the data).';
COMMENT ON COLUMN public.widget_configs.crm_webhook_url IS
  'When submission_target = ''webhook_direct'', the CRM inbound-webhook URL the browser POSTs to (e.g. a GHL inbound webhook trigger URL).';
