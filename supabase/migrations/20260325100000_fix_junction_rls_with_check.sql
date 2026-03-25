-- ============================================================
-- Fix RLS policies on junction tables: add WITH CHECK clauses
-- so that INSERT operations are not silently rejected.
-- ============================================================

-- service_body_regions ----------------------------------------

DROP POLICY IF EXISTS "Center admins can manage service-region links" ON service_body_regions;

CREATE POLICY "Center admins can manage service-region links" ON service_body_regions
  FOR ALL
  USING (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  )
  WITH CHECK (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );

-- concern_services --------------------------------------------

DROP POLICY IF EXISTS "Center admins can manage concern-service links" ON concern_services;

CREATE POLICY "Center admins can manage concern-service links" ON concern_services
  FOR ALL
  USING (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  )
  WITH CHECK (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );

-- location_services -------------------------------------------

DROP POLICY IF EXISTS "Center admins can manage location-service links" ON location_services;

CREATE POLICY "Center admins can manage location-service links" ON location_services
  FOR ALL
  USING (
    location_id IN (
      SELECT id FROM tenant_locations WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT id FROM tenant_locations WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );
