-- Performance indexes for frequently queried tables.
-- Core tables (tenants, body_regions, concerns, form_fields, form_submissions,
-- tenant_locations) had no indexes beyond primary keys.

-- body_regions: filtered by tenant_id + is_active
CREATE INDEX IF NOT EXISTS idx_body_regions_tenant ON body_regions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_body_regions_default_active ON body_regions(is_active) WHERE tenant_id IS NULL;

-- concerns: filtered by (body_region_id, is_active)
CREATE INDEX IF NOT EXISTS idx_concerns_region_active ON concerns(body_region_id, is_active);

-- form_fields: filtered by tenant_id, ordered by display_order
CREATE INDEX IF NOT EXISTS idx_form_fields_tenant ON form_fields(tenant_id, display_order);

-- form_submissions: filtered by tenant_id, ordered by created_at (dashboard views)
CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant ON form_submissions(tenant_id, created_at DESC);

-- tenants: partial index for active-only lookups
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(id) WHERE status = 'active';

-- tenant_locations: filtered by tenant_id
CREATE INDEX IF NOT EXISTS idx_tenant_locations_tenant ON tenant_locations(tenant_id);
