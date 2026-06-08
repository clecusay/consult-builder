-- ============================================================
-- Migration: Per-tenant GTM container on the hosted widget page
--
-- The embed inherits the host site's Google Tag Manager, but the
-- standalone hosted page (/widget/[slug]) has no GTM, so the
-- consultBuilder.formSubmission dataLayer event has no consumer.
-- Storing a per-tenant container id lets the hosted page inject the
-- tenant's own GTM container (and track.js) so conversions are tracked.
-- ============================================================

BEGIN;

ALTER TABLE public.widget_configs
  ADD COLUMN IF NOT EXISTS gtm_container_id text;

COMMENT ON COLUMN public.widget_configs.gtm_container_id IS
  'Google Tag Manager container id (e.g. GTM-XXXXXXX). When set, the hosted widget page injects this container so the dataLayer submission event is tracked. Embeds use the host site''s own GTM.';

COMMIT;
