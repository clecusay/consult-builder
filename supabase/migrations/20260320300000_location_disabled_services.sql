-- ============================================================
-- Location Disabled Services — opt-out model
-- By default all active services are available at every location.
-- This table records services a tenant has explicitly disabled
-- at a specific location.
-- ============================================================

CREATE TABLE IF NOT EXISTS location_disabled_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES tenant_locations(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_location_disabled_services_location
  ON location_disabled_services(location_id);
CREATE INDEX IF NOT EXISTS idx_location_disabled_services_service
  ON location_disabled_services(service_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE location_disabled_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their disabled location-service links"
  ON location_disabled_services FOR SELECT USING (
    location_id IN (
      SELECT id FROM tenant_locations WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Center admins can manage disabled location-service links"
  ON location_disabled_services FOR ALL USING (
    location_id IN (
      SELECT id FROM tenant_locations WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );
