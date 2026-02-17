-- ============================================================
-- Service Catalog Schema — Flexible Body Region → Concern → Service
-- ============================================================

-- Widget mode enum for configurable widget flow
DO $$ BEGIN
  CREATE TYPE widget_mode AS ENUM (
    'regions_concerns_services',
    'regions_services',
    'regions_concerns',
    'concerns_only',
    'services_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Diagram type enum
DO $$ BEGIN
  CREATE TYPE diagram_type AS ENUM ('face', 'body', 'full_body');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add widget_mode and diagram_type to widget_configs
ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS widget_mode widget_mode NOT NULL DEFAULT 'regions_concerns',
  ADD COLUMN IF NOT EXISTS diagram_type diagram_type NOT NULL DEFAULT 'full_body';

-- ============================================================
-- Service Categories (Surgical, Non-Surgical, Med Spa, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = platform default
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  display_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- ============================================================
-- Services (individual treatments/procedures)
-- ============================================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id uuid REFERENCES service_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

-- ============================================================
-- Junction: Services ↔ Body Regions
-- ============================================================
CREATE TABLE IF NOT EXISTS service_body_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  body_region_id uuid NOT NULL REFERENCES body_regions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, body_region_id)
);

-- ============================================================
-- Junction: Concerns ↔ Services
-- ============================================================
CREATE TABLE IF NOT EXISTS concern_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id uuid NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (concern_id, service_id)
);

-- ============================================================
-- Junction: Locations ↔ Services
-- ============================================================
CREATE TABLE IF NOT EXISTS location_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES tenant_locations(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (location_id, service_id)
);

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_service_categories_tenant ON service_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_service_body_regions_service ON service_body_regions(service_id);
CREATE INDEX IF NOT EXISTS idx_service_body_regions_region ON service_body_regions(body_region_id);
CREATE INDEX IF NOT EXISTS idx_concern_services_concern ON concern_services(concern_id);
CREATE INDEX IF NOT EXISTS idx_concern_services_service ON concern_services(service_id);
CREATE INDEX IF NOT EXISTS idx_location_services_location ON location_services(location_id);
CREATE INDEX IF NOT EXISTS idx_location_services_service ON location_services(service_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- service_categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own and default categories" ON service_categories
  FOR SELECT USING (
    tenant_id IS NULL
    OR tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Center admins can manage their categories" ON service_categories
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
    )
  );

-- services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own services" ON services
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Center admins can manage their services" ON services
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
    )
  );

-- service_body_regions
ALTER TABLE service_body_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their service-region links" ON service_body_regions
  FOR SELECT USING (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Center admins can manage service-region links" ON service_body_regions
  FOR ALL USING (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );

-- concern_services
ALTER TABLE concern_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their concern-service links" ON concern_services
  FOR SELECT USING (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Center admins can manage concern-service links" ON concern_services
  FOR ALL USING (
    service_id IN (
      SELECT id FROM services WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );

-- location_services
ALTER TABLE location_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their location-service links" ON location_services
  FOR SELECT USING (
    location_id IN (
      SELECT id FROM tenant_locations WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Center admins can manage location-service links" ON location_services
  FOR ALL USING (
    location_id IN (
      SELECT id FROM tenant_locations WHERE tenant_id IN (
        SELECT tenant_id FROM user_profiles
        WHERE user_id = auth.uid() AND role IN ('center_admin', 'platform_admin')
      )
    )
  );

-- ============================================================
-- Seed platform default service categories
-- ============================================================
INSERT INTO service_categories (tenant_id, name, slug, description, display_order) VALUES
  (NULL, 'Surgical Procedures', 'surgical', 'Invasive procedures performed by a surgeon', 1),
  (NULL, 'Non-Surgical Treatments', 'non-surgical', 'Minimally invasive or non-invasive treatments', 2),
  (NULL, 'Med Spa Services', 'med-spa', 'Aesthetic and wellness treatments offered at med spas', 3),
  (NULL, 'Skin Treatments', 'skin', 'Dermatological and skin rejuvenation procedures', 4)
ON CONFLICT DO NOTHING;
