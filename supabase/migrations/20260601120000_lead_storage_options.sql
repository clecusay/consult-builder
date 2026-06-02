-- ============================================================
-- Migration: Lead storage options
--
-- Lets a tenant on the 'backend' submission target store leads in
-- form_submissions *and* forward them to a CRM webhook, with a
-- per-tenant switch to turn storage off, plus the ability to delete
-- stored leads from the dashboard. Also persists date of birth and
-- marketing attribution on stored leads.
-- ============================================================

BEGIN;

-- Per-tenant storage switch. When false, /api/widget/submit still
-- delivers the webhook + notification emails but does NOT persist the
-- lead to form_submissions.
ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS store_submissions boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.widget_configs.store_submissions IS
  'When false, /api/widget/submit forwards the webhook + notifications but does not store the lead in form_submissions.';

-- Persist date of birth + marketing attribution on stored leads.
ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS date_of_birth text,
  ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}';

-- Allow tenant members to delete their own submissions from the dashboard.
DROP POLICY IF EXISTS "Tenant members can delete own submissions" ON public.form_submissions;
CREATE POLICY "Tenant members can delete own submissions"
  ON public.form_submissions FOR DELETE
  USING (tenant_id = public.current_tenant_id());

COMMIT;
