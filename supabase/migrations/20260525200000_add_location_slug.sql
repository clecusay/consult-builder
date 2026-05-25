-- ============================================================
-- Migration: Add a human-readable slug to tenant locations so
-- third-party systems (CRMs, dashboards, reporting) can key off
-- a stable, readable identifier instead of the auto-generated UUID.
-- ============================================================

ALTER TABLE public.tenant_locations
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Unique per tenant (two tenants may legitimately both have an "oklahoma_city").
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_locations_tenant_slug
  ON public.tenant_locations (tenant_id, slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN public.tenant_locations.slug IS
  'Stable, human-readable identifier for the location (e.g. "oklahoma_city"). Used as the location_id in third-party CRM webhook payloads. Unique within a tenant.';
