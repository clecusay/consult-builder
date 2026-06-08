-- ============================================================
-- Migration: Unify submission routing
--
-- Replaces the split routing model (form page: submission_target +
-- crm_webhook_url for the browser-direct path / integration page:
-- webhook_url for the backend path) with a single backend-mediated
-- model: every native submission posts to /api/widget/submit, which
-- forwards to ONE webhook and/or stores the lead based on two
-- independent switches.
--
--   forward_to_webhook  -> deliver to webhook_url
--   store_submissions   -> persist in form_submissions
--
-- At least one must be on (enforced in the dashboard + submit route).
-- The old submission_target / crm_webhook_url columns are left in place
-- but are no longer read or written.
-- ============================================================

BEGIN;

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS forward_to_webhook boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.widget_configs.forward_to_webhook IS
  'When true, /api/widget/submit forwards the lead to webhook_url. Pairs with store_submissions; at least one must be enabled.';

-- Backfill: behavior-neutral migration off the old model.

-- Browser-direct tenants delivered the flat payload straight to their CRM
-- and stored nothing. Reproduce that via the backend: carry their CRM URL
-- into webhook_url, forward on, crm_flat shape, storage off.
UPDATE public.widget_configs
SET
  webhook_url = COALESCE(NULLIF(webhook_url, ''), crm_webhook_url),
  webhook_format = 'crm_flat',
  forward_to_webhook = true,
  store_submissions = false
WHERE submission_target = 'webhook_direct'
  AND crm_webhook_url IS NOT NULL
  AND crm_webhook_url <> '';

-- Backend tenants already stored leads; forwarding was implicitly "on"
-- whenever a webhook_url was present. Make that explicit.
UPDATE public.widget_configs
SET forward_to_webhook = true
WHERE COALESCE(submission_target, 'backend') <> 'webhook_direct'
  AND webhook_url IS NOT NULL
  AND webhook_url <> '';

COMMIT;
