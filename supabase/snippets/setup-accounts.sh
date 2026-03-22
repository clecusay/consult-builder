#!/usr/bin/env bash
# ============================================================
# Setup all 5 local dev accounts with varied configurations
# Run from project root: bash supabase/snippets/setup-accounts.sh
# ============================================================
set -euo pipefail

SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DISCORD_WEBHOOK="https://discord.com/api/webhooks/1485142843898069044/Re6t2PkH9vC8yOXA4EeaPKczdkcCwwJcHbpjerY1NwBz_FJDRFwWBnBNDaBD-M9g8P9_"

echo "=== Creating Auth Users ==="

# Function to create a user via Supabase Admin API
create_user() {
  local email="$1"
  local password="$2"
  local full_name="$3"
  local center_name="$4"
  local user_id

  user_id=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${email}\",
      \"password\": \"${password}\",
      \"email_confirm\": true,
      \"user_metadata\": {
        \"full_name\": \"${full_name}\",
        \"center_name\": \"${center_name}\"
      }
    }" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

  echo "  Created: ${email} -> ${user_id}"
  echo "${user_id}"
}

# Create all 5 users
USER1_ID=$(create_user "admin@edgetotrade.com" "Admin@12345" "Admin User" "EdgeToTrade Hospital")
USER2_ID=$(create_user "sarah@sunrisemedical.com" "Center@12345" "Dr. Sarah Johnson" "Sunrise Medical Center")
USER3_ID=$(create_user "dr.chen@faceonlyclinic.com" "FaceOnly@12345" "Dr. Lisa Chen" "Face Only Clinic")
USER4_ID=$(create_user "dr.martinez@bodysculpting.com" "BodySculpt@12345" "Dr. Maria Martinez" "Body Sculpting Center")
USER5_ID=$(create_user "dr.patel@fullservicemedspa.com" "FullService@12345" "Dr. Priya Patel" "Full Service Med Spa")

echo ""
echo "=== Creating Tenants, Profiles, Configs, Locations, Services ==="

psql "${DB_URL}" <<EOSQL

-- ============================================================
-- DETERMINISTIC TENANT IDs
-- ============================================================
DO \$\$
DECLARE
  t1_id uuid := 'c0000001-0000-0000-0000-000000000001';
  t2_id uuid := 'c0000001-0000-0000-0000-000000000002';
  t3_id uuid := 'c0000001-0000-0000-0000-000000000003';
  t4_id uuid := 'c0000001-0000-0000-0000-000000000004';
  t5_id uuid := 'c0000001-0000-0000-0000-000000000005';

  u1_id uuid := '${USER1_ID}';
  u2_id uuid := '${USER2_ID}';
  u3_id uuid := '${USER3_ID}';
  u4_id uuid := '${USER4_ID}';
  u5_id uuid := '${USER5_ID}';

  -- Location IDs
  loc1a uuid := 'd0000001-0000-0000-0000-000000000001';
  loc1b uuid := 'd0000001-0000-0000-0000-000000000002';
  loc2a uuid := 'd0000001-0000-0000-0000-000000000003';
  loc2b uuid := 'd0000001-0000-0000-0000-000000000004';
  loc2c uuid := 'd0000001-0000-0000-0000-000000000005';
  loc3a uuid := 'd0000001-0000-0000-0000-000000000006';
  loc3b uuid := 'd0000001-0000-0000-0000-000000000007';
  loc4a uuid := 'd0000001-0000-0000-0000-000000000008';
  loc4b uuid := 'd0000001-0000-0000-0000-000000000009';
  loc5a uuid := 'd0000001-0000-0000-0000-000000000010';
  loc5b uuid := 'd0000001-0000-0000-0000-000000000011';
  loc5c uuid := 'd0000001-0000-0000-0000-000000000012';

  -- Service IDs
  svc_id uuid;

  -- Body region IDs (from seed.sql)
  -- Female face
  f_upper_face uuid := 'a0000001-0000-0000-0000-000000000011';
  f_midface    uuid := 'a0000001-0000-0000-0000-000000000012';
  f_lower_face uuid := 'a0000001-0000-0000-0000-000000000013';
  f_neck       uuid := 'a0000001-0000-0000-0000-000000000014';
  f_lips       uuid := 'a0000001-0000-0000-0000-000000000015';
  -- Female body
  f_abdomen    uuid := 'a0000001-0000-0000-0000-000000000001';
  f_arms       uuid := 'a0000001-0000-0000-0000-000000000002';
  f_chest      uuid := 'a0000001-0000-0000-0000-000000000003';
  f_flanks     uuid := 'a0000001-0000-0000-0000-000000000004';
  f_thighs     uuid := 'a0000001-0000-0000-0000-000000000006';
  f_back       uuid := 'a0000001-0000-0000-0000-000000000009';
  f_buttocks   uuid := 'a0000001-0000-0000-0000-000000000010';
  -- Male face
  m_upper_face uuid := 'b0000001-0000-0000-0000-000000000010';
  m_midface    uuid := 'b0000001-0000-0000-0000-000000000011';
  m_lower_face uuid := 'b0000001-0000-0000-0000-000000000012';
  m_neck       uuid := 'b0000001-0000-0000-0000-000000000013';
  m_lips       uuid := 'b0000001-0000-0000-0000-000000000014';
  -- Male body
  m_abdomen    uuid := 'b0000001-0000-0000-0000-000000000001';
  m_arms       uuid := 'b0000001-0000-0000-0000-000000000002';
  m_chest      uuid := 'b0000001-0000-0000-0000-000000000003';
  m_flanks     uuid := 'b0000001-0000-0000-0000-000000000004';
  m_thighs     uuid := 'b0000001-0000-0000-0000-000000000006';
  m_back       uuid := 'b0000001-0000-0000-0000-000000000008';
  m_buttocks   uuid := 'b0000001-0000-0000-0000-000000000009';

BEGIN

-- ============================================================
-- 1. TENANTS
-- ============================================================
INSERT INTO tenants (id, name, slug) VALUES
  (t1_id, 'EdgeToTrade Hospital',    'edgetotrade-hospital'),
  (t2_id, 'Sunrise Medical Center',  'sunrise-medical-center'),
  (t3_id, 'Face Only Clinic',        'face-only-clinic'),
  (t4_id, 'Body Sculpting Center',   'body-sculpting-center'),
  (t5_id, 'Full Service Med Spa',    'full-service-medspa');

-- ============================================================
-- 2. USER PROFILES
-- ============================================================
INSERT INTO user_profiles (user_id, tenant_id, role, full_name) VALUES
  (u1_id, t1_id, 'platform_admin', 'Admin User'),
  (u2_id, t2_id, 'center_admin',   'Dr. Sarah Johnson'),
  (u3_id, t3_id, 'center_admin',   'Dr. Lisa Chen'),
  (u4_id, t4_id, 'center_admin',   'Dr. Maria Martinez'),
  (u5_id, t5_id, 'center_admin',   'Dr. Priya Patel');

-- ============================================================
-- 3. WIDGET CONFIGS (with Discord webhook)
-- ============================================================
INSERT INTO widget_configs (tenant_id, webhook_url, widget_mode, diagram_type, primary_color, secondary_color, accent_color) VALUES
  (t1_id, '${DISCORD_WEBHOOK}', 'regions_concerns', 'face',      '#1a1a2e', '#16213e', '#0f3460'),
  (t2_id, '${DISCORD_WEBHOOK}', 'regions_concerns', 'face',      '#2563eb', '#1d4ed8', '#1e40af'),
  (t3_id, '${DISCORD_WEBHOOK}', 'regions_concerns', 'face',      '#ec4899', '#db2777', '#be185d'),
  (t4_id, '${DISCORD_WEBHOOK}', 'regions_concerns', 'body',      '#059669', '#047857', '#065f46'),
  (t5_id, '${DISCORD_WEBHOOK}', 'regions_concerns', 'full_body', '#8b5cf6', '#7c3aed', '#6d28d9');

-- ============================================================
-- 4. TENANT LOCATIONS
-- ============================================================
-- Tenant 1: EdgeToTrade Hospital — 2 locations
INSERT INTO tenant_locations (id, tenant_id, name, address, city, state, zip, phone, is_primary) VALUES
  (loc1a, t1_id, 'Main Hospital',   '100 Medical Blvd',   'Los Angeles', 'CA', '90001', '(310) 555-0100', true),
  (loc1b, t1_id, 'Surgical Center', '200 Surgery Way',    'Los Angeles', 'CA', '90002', '(310) 555-0200', false);

-- Tenant 2: Sunrise Medical — 3 locations
INSERT INTO tenant_locations (id, tenant_id, name, address, city, state, zip, phone, is_primary) VALUES
  (loc2a, t2_id, 'Main Office',     '300 Sunrise Ave',    'Phoenix',     'AZ', '85001', '(602) 555-0300', true),
  (loc2b, t2_id, 'Surgical Wing',   '310 Sunrise Ave',    'Phoenix',     'AZ', '85001', '(602) 555-0310', false),
  (loc2c, t2_id, 'Recovery Suite',  '400 Healing Ln',     'Scottsdale',  'AZ', '85250', '(480) 555-0400', false);

-- Tenant 3: Face Only Clinic — 2 locations
INSERT INTO tenant_locations (id, tenant_id, name, address, city, state, zip, phone, is_primary) VALUES
  (loc3a, t3_id, 'Downtown Clinic',     '500 Beauty St',    'San Francisco', 'CA', '94102', '(415) 555-0500', true),
  (loc3b, t3_id, 'Beverly Hills Office', '600 Rodeo Dr',    'Beverly Hills', 'CA', '90210', '(310) 555-0600', false);

-- Tenant 4: Body Sculpting — 2 locations
INSERT INTO tenant_locations (id, tenant_id, name, address, city, state, zip, phone, is_primary) VALUES
  (loc4a, t4_id, 'Main Center',   '700 Sculpt Way',    'Miami',       'FL', '33101', '(305) 555-0700', true),
  (loc4b, t4_id, 'North Campus',  '800 Wellness Dr',   'Fort Lauderdale', 'FL', '33301', '(954) 555-0800', false);

-- Tenant 5: Full Service Med Spa — 3 locations
INSERT INTO tenant_locations (id, tenant_id, name, address, city, state, zip, phone, is_primary) VALUES
  (loc5a, t5_id, 'Main Spa',       '900 Serenity Blvd', 'New York',    'NY', '10001', '(212) 555-0900', true),
  (loc5b, t5_id, 'West Location',  '1000 Hudson St',    'New York',    'NY', '10014', '(212) 555-1000', false),
  (loc5c, t5_id, 'East Location',  '1100 Park Ave',     'New York',    'NY', '10028', '(212) 555-1100', false);

-- ============================================================
-- 5. SERVICE CATEGORIES
-- ============================================================
-- Tenant 1 categories
INSERT INTO service_categories (id, tenant_id, name, slug, display_order) VALUES
  ('e0000001-0000-0000-0000-000000000001', t1_id, 'Surgical',     'surgical',     1);

-- Tenant 2 categories
INSERT INTO service_categories (id, tenant_id, name, slug, display_order) VALUES
  ('e0000001-0000-0000-0000-000000000010', t2_id, 'Surgical Face', 'surgical-face', 1);

-- Tenant 3 categories
INSERT INTO service_categories (id, tenant_id, name, slug, display_order) VALUES
  ('e0000001-0000-0000-0000-000000000020', t3_id, 'Injectables',  'injectables',  1),
  ('e0000001-0000-0000-0000-000000000021', t3_id, 'Fillers',      'fillers',      2);

-- Tenant 4 categories
INSERT INTO service_categories (id, tenant_id, name, slug, display_order) VALUES
  ('e0000001-0000-0000-0000-000000000030', t4_id, 'Non-Surgical', 'non-surgical', 1),
  ('e0000001-0000-0000-0000-000000000031', t4_id, 'Surgical',     'surgical',     2);

-- Tenant 5 categories
INSERT INTO service_categories (id, tenant_id, name, slug, display_order) VALUES
  ('e0000001-0000-0000-0000-000000000040', t5_id, 'Injectables',  'injectables',  1),
  ('e0000001-0000-0000-0000-000000000041', t5_id, 'Surgical',     'surgical',     2);

-- ============================================================
-- 6. SERVICES
-- ============================================================

-- ── Tenant 1: EdgeToTrade Hospital (face only — surgical) ──
INSERT INTO services (id, tenant_id, category_id, name, slug, display_order) VALUES
  ('f0000001-0000-0000-0000-000000000001', t1_id, 'e0000001-0000-0000-0000-000000000001', 'Facelift',     'facelift',     1),
  ('f0000001-0000-0000-0000-000000000002', t1_id, 'e0000001-0000-0000-0000-000000000001', 'Rhinoplasty',  'rhinoplasty',  2);

-- ── Tenant 2: Sunrise Medical (14 surgical face services) ──
INSERT INTO services (id, tenant_id, category_id, name, slug, display_order) VALUES
  ('f0000002-0000-0000-0000-000000000001', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Facelift',             'facelift',             1),
  ('f0000002-0000-0000-0000-000000000002', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Rhinoplasty',          'rhinoplasty',          2),
  ('f0000002-0000-0000-0000-000000000003', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Brow Lift',            'brow-lift',            3),
  ('f0000002-0000-0000-0000-000000000004', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Blepharoplasty',       'blepharoplasty',       4),
  ('f0000002-0000-0000-0000-000000000005', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Neck Lift',            'neck-lift',            5),
  ('f0000002-0000-0000-0000-000000000006', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Chin Augmentation',    'chin-augmentation',    6),
  ('f0000002-0000-0000-0000-000000000007', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Cheek Implants',       'cheek-implants',       7),
  ('f0000002-0000-0000-0000-000000000008', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Lip Lift',             'lip-lift',             8),
  ('f0000002-0000-0000-0000-000000000009', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Ear Surgery (Otoplasty)', 'otoplasty',         9),
  ('f0000002-0000-0000-0000-000000000010', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Hairline Lowering',    'hairline-lowering',    10),
  ('f0000002-0000-0000-0000-000000000011', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Fat Transfer (Face)',  'fat-transfer-face',    11),
  ('f0000002-0000-0000-0000-000000000012', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Facial Liposuction',   'facial-liposuction',   12),
  ('f0000002-0000-0000-0000-000000000013', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Skin Resurfacing',     'skin-resurfacing',     13),
  ('f0000002-0000-0000-0000-000000000014', t2_id, 'e0000001-0000-0000-0000-000000000010', 'Scar Revision',        'scar-revision',        14);

-- ── Tenant 3: Face Only Clinic (non-surgical face) ──
INSERT INTO services (id, tenant_id, category_id, name, slug, display_order) VALUES
  ('f0000003-0000-0000-0000-000000000001', t3_id, 'e0000001-0000-0000-0000-000000000020', 'Botox Forehead',  'botox-forehead',  1),
  ('f0000003-0000-0000-0000-000000000002', t3_id, 'e0000001-0000-0000-0000-000000000021', 'Cheek Filler',    'cheek-filler',    2),
  ('f0000003-0000-0000-0000-000000000003', t3_id, 'e0000001-0000-0000-0000-000000000021', 'Lip Filler',      'lip-filler',      3);

-- ── Tenant 4: Body Sculpting Center (body only) ──
INSERT INTO services (id, tenant_id, category_id, name, slug, display_order) VALUES
  ('f0000004-0000-0000-0000-000000000001', t4_id, 'e0000001-0000-0000-0000-000000000030', 'CoolSculpting',  'coolsculpting',  1),
  ('f0000004-0000-0000-0000-000000000002', t4_id, 'e0000001-0000-0000-0000-000000000031', 'Liposuction',    'liposuction',    2),
  ('f0000004-0000-0000-0000-000000000003', t4_id, 'e0000001-0000-0000-0000-000000000031', 'Tummy Tuck',     'tummy-tuck',     3);

-- ── Tenant 5: Full Service Med Spa (face + body) ──
INSERT INTO services (id, tenant_id, category_id, name, slug, display_order) VALUES
  ('f0000005-0000-0000-0000-000000000001', t5_id, 'e0000001-0000-0000-0000-000000000040', 'Botox',              'botox',              1),
  ('f0000005-0000-0000-0000-000000000002', t5_id, 'e0000001-0000-0000-0000-000000000040', 'Dermal Fillers',     'dermal-fillers',     2),
  ('f0000005-0000-0000-0000-000000000003', t5_id, 'e0000001-0000-0000-0000-000000000041', 'Breast Augmentation','breast-augmentation', 3),
  ('f0000005-0000-0000-0000-000000000004', t5_id, 'e0000001-0000-0000-0000-000000000041', 'Liposuction',        'liposuction',        4);

-- ============================================================
-- 7. SERVICE ↔ BODY REGION LINKS
-- (Determines which regions show in the widget per service)
-- ============================================================

-- ── Tenant 1: Facelift → face regions, Rhinoplasty → midface ──
INSERT INTO service_body_regions (service_id, body_region_id) VALUES
  -- Facelift → upper face, midface, lower face, neck (both genders)
  ('f0000001-0000-0000-0000-000000000001', f_upper_face),
  ('f0000001-0000-0000-0000-000000000001', f_midface),
  ('f0000001-0000-0000-0000-000000000001', f_lower_face),
  ('f0000001-0000-0000-0000-000000000001', f_neck),
  ('f0000001-0000-0000-0000-000000000001', m_upper_face),
  ('f0000001-0000-0000-0000-000000000001', m_midface),
  ('f0000001-0000-0000-0000-000000000001', m_lower_face),
  ('f0000001-0000-0000-0000-000000000001', m_neck),
  -- Rhinoplasty → midface (both genders)
  ('f0000001-0000-0000-0000-000000000002', f_midface),
  ('f0000001-0000-0000-0000-000000000002', m_midface);

-- ── Tenant 2: 14 surgical face services → various face regions ──
INSERT INTO service_body_regions (service_id, body_region_id) VALUES
  -- Facelift → upper, mid, lower face, neck
  ('f0000002-0000-0000-0000-000000000001', f_upper_face), ('f0000002-0000-0000-0000-000000000001', f_midface),
  ('f0000002-0000-0000-0000-000000000001', f_lower_face), ('f0000002-0000-0000-0000-000000000001', f_neck),
  ('f0000002-0000-0000-0000-000000000001', m_upper_face), ('f0000002-0000-0000-0000-000000000001', m_midface),
  ('f0000002-0000-0000-0000-000000000001', m_lower_face), ('f0000002-0000-0000-0000-000000000001', m_neck),
  -- Rhinoplasty → midface
  ('f0000002-0000-0000-0000-000000000002', f_midface), ('f0000002-0000-0000-0000-000000000002', m_midface),
  -- Brow Lift → upper face
  ('f0000002-0000-0000-0000-000000000003', f_upper_face), ('f0000002-0000-0000-0000-000000000003', m_upper_face),
  -- Blepharoplasty → upper face
  ('f0000002-0000-0000-0000-000000000004', f_upper_face), ('f0000002-0000-0000-0000-000000000004', m_upper_face),
  -- Neck Lift → neck
  ('f0000002-0000-0000-0000-000000000005', f_neck), ('f0000002-0000-0000-0000-000000000005', m_neck),
  -- Chin Augmentation → lower face
  ('f0000002-0000-0000-0000-000000000006', f_lower_face), ('f0000002-0000-0000-0000-000000000006', m_lower_face),
  -- Cheek Implants → midface
  ('f0000002-0000-0000-0000-000000000007', f_midface), ('f0000002-0000-0000-0000-000000000007', m_midface),
  -- Lip Lift → lips
  ('f0000002-0000-0000-0000-000000000008', f_lips), ('f0000002-0000-0000-0000-000000000008', m_lips),
  -- Otoplasty → upper face (ear area)
  ('f0000002-0000-0000-0000-000000000009', f_upper_face), ('f0000002-0000-0000-0000-000000000009', m_upper_face),
  -- Hairline Lowering → upper face
  ('f0000002-0000-0000-0000-000000000010', f_upper_face), ('f0000002-0000-0000-0000-000000000010', m_upper_face),
  -- Fat Transfer Face → midface, lower face
  ('f0000002-0000-0000-0000-000000000011', f_midface), ('f0000002-0000-0000-0000-000000000011', f_lower_face),
  ('f0000002-0000-0000-0000-000000000011', m_midface), ('f0000002-0000-0000-0000-000000000011', m_lower_face),
  -- Facial Liposuction → lower face, neck
  ('f0000002-0000-0000-0000-000000000012', f_lower_face), ('f0000002-0000-0000-0000-000000000012', f_neck),
  ('f0000002-0000-0000-0000-000000000012', m_lower_face), ('f0000002-0000-0000-0000-000000000012', m_neck),
  -- Skin Resurfacing → all face
  ('f0000002-0000-0000-0000-000000000013', f_upper_face), ('f0000002-0000-0000-0000-000000000013', f_midface),
  ('f0000002-0000-0000-0000-000000000013', f_lower_face),
  ('f0000002-0000-0000-0000-000000000013', m_upper_face), ('f0000002-0000-0000-0000-000000000013', m_midface),
  ('f0000002-0000-0000-0000-000000000013', m_lower_face),
  -- Scar Revision → all face + neck
  ('f0000002-0000-0000-0000-000000000014', f_upper_face), ('f0000002-0000-0000-0000-000000000014', f_midface),
  ('f0000002-0000-0000-0000-000000000014', f_lower_face), ('f0000002-0000-0000-0000-000000000014', f_neck),
  ('f0000002-0000-0000-0000-000000000014', m_upper_face), ('f0000002-0000-0000-0000-000000000014', m_midface),
  ('f0000002-0000-0000-0000-000000000014', m_lower_face), ('f0000002-0000-0000-0000-000000000014', m_neck);

-- ── Tenant 3: 3 non-surgical face services ──
INSERT INTO service_body_regions (service_id, body_region_id) VALUES
  -- Botox Forehead → upper face
  ('f0000003-0000-0000-0000-000000000001', f_upper_face), ('f0000003-0000-0000-0000-000000000001', m_upper_face),
  -- Cheek Filler → midface
  ('f0000003-0000-0000-0000-000000000002', f_midface), ('f0000003-0000-0000-0000-000000000002', m_midface),
  -- Lip Filler → lips
  ('f0000003-0000-0000-0000-000000000003', f_lips), ('f0000003-0000-0000-0000-000000000003', m_lips);

-- ── Tenant 4: 3 body-only services ──
INSERT INTO service_body_regions (service_id, body_region_id) VALUES
  -- CoolSculpting → abdomen, flanks, thighs, arms (both genders)
  ('f0000004-0000-0000-0000-000000000001', f_abdomen), ('f0000004-0000-0000-0000-000000000001', f_flanks),
  ('f0000004-0000-0000-0000-000000000001', f_thighs),  ('f0000004-0000-0000-0000-000000000001', f_arms),
  ('f0000004-0000-0000-0000-000000000001', m_abdomen), ('f0000004-0000-0000-0000-000000000001', m_flanks),
  ('f0000004-0000-0000-0000-000000000001', m_thighs),  ('f0000004-0000-0000-0000-000000000001', m_arms),
  -- Liposuction → abdomen, flanks, thighs, back, arms (both genders)
  ('f0000004-0000-0000-0000-000000000002', f_abdomen), ('f0000004-0000-0000-0000-000000000002', f_flanks),
  ('f0000004-0000-0000-0000-000000000002', f_thighs),  ('f0000004-0000-0000-0000-000000000002', f_back),
  ('f0000004-0000-0000-0000-000000000002', f_arms),
  ('f0000004-0000-0000-0000-000000000002', m_abdomen), ('f0000004-0000-0000-0000-000000000002', m_flanks),
  ('f0000004-0000-0000-0000-000000000002', m_thighs),  ('f0000004-0000-0000-0000-000000000002', m_back),
  ('f0000004-0000-0000-0000-000000000002', m_arms),
  -- Tummy Tuck → abdomen, flanks (both genders)
  ('f0000004-0000-0000-0000-000000000003', f_abdomen), ('f0000004-0000-0000-0000-000000000003', f_flanks),
  ('f0000004-0000-0000-0000-000000000003', m_abdomen), ('f0000004-0000-0000-0000-000000000003', m_flanks);

-- ── Tenant 5: Mixed face + body ──
INSERT INTO service_body_regions (service_id, body_region_id) VALUES
  -- Botox → upper face (forehead, crow's feet)
  ('f0000005-0000-0000-0000-000000000001', f_upper_face), ('f0000005-0000-0000-0000-000000000001', m_upper_face),
  -- Dermal Fillers → midface, lips, lower face
  ('f0000005-0000-0000-0000-000000000002', f_midface), ('f0000005-0000-0000-0000-000000000002', f_lips),
  ('f0000005-0000-0000-0000-000000000002', f_lower_face),
  ('f0000005-0000-0000-0000-000000000002', m_midface), ('f0000005-0000-0000-0000-000000000002', m_lips),
  ('f0000005-0000-0000-0000-000000000002', m_lower_face),
  -- Breast Augmentation → chest (female only)
  ('f0000005-0000-0000-0000-000000000003', f_chest),
  -- Liposuction → abdomen, flanks, thighs (both genders)
  ('f0000005-0000-0000-0000-000000000004', f_abdomen), ('f0000005-0000-0000-0000-000000000004', f_flanks),
  ('f0000005-0000-0000-0000-000000000004', f_thighs),
  ('f0000005-0000-0000-0000-000000000004', m_abdomen), ('f0000005-0000-0000-0000-000000000004', m_flanks),
  ('f0000005-0000-0000-0000-000000000004', m_thighs);

-- ============================================================
-- 8. DEFAULT FORM FIELDS (6 per tenant)
-- ============================================================
INSERT INTO form_fields (tenant_id, field_key, field_type, label, placeholder, is_required, display_order)
SELECT t.id, f.field_key, f.field_type, f.label, f.placeholder, f.is_required, f.display_order
FROM (VALUES (t1_id), (t2_id), (t3_id), (t4_id), (t5_id)) AS t(id)
CROSS JOIN (VALUES
  ('first_name',   'text',     'First Name',  'Jane',             true,  0),
  ('last_name',    'text',     'Last Name',   'Doe',              true,  1),
  ('email',        'email',    'Email',       'jane@example.com', true,  2),
  ('phone',        'phone',    'Phone',       '(555) 555-5555',   false, 3),
  ('sms_opt_in',   'checkbox', 'SMS Opt-In',  'I agree to receive SMS text messages with appointment reminders, promotions, and special offers. Message & data rates may apply. Reply STOP to unsubscribe.', false, 100),
  ('email_opt_in', 'checkbox', 'Email Opt-In','I would like to receive email updates including exclusive promotions, new treatment announcements, and helpful skincare tips. Unsubscribe anytime.', false, 101)
) AS f(field_key, field_type, label, placeholder, is_required, display_order);

-- ============================================================
-- 9. DISABLE SOME SERVICES AT SPECIFIC LOCATIONS (variety)
-- ============================================================
-- Tenant 2: Disable Scar Revision at Recovery Suite (post-op only location)
INSERT INTO location_disabled_services (location_id, service_id) VALUES
  (loc2c, 'f0000002-0000-0000-0000-000000000014');

-- Tenant 4: Disable Tummy Tuck at North Campus (non-surgical only)
INSERT INTO location_disabled_services (location_id, service_id) VALUES
  (loc4b, 'f0000004-0000-0000-0000-000000000003');

-- Tenant 5: Disable Breast Augmentation at East Location (injectables only)
INSERT INTO location_disabled_services (location_id, service_id) VALUES
  (loc5c, 'f0000005-0000-0000-0000-000000000003'),
  (loc5c, 'f0000005-0000-0000-0000-000000000004');

RAISE NOTICE 'All tenant data created successfully!';

END \$\$;

EOSQL

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Accounts:"
echo "  1. admin@edgetotrade.com     / Admin@12345       (Platform Admin)"
echo "  2. sarah@sunrisemedical.com  / Center@12345      (14 surgical face services)"
echo "  3. dr.chen@faceonlyclinic.com / FaceOnly@12345   (3 face injectables/fillers)"
echo "  4. dr.martinez@bodysculpting.com / BodySculpt@12345 (3 body services)"
echo "  5. dr.patel@fullservicemedspa.com / FullService@12345 (4 mixed face+body)"
echo ""
echo "Discord webhook set for all tenants."
echo "Login at: http://localhost:3001/login"
