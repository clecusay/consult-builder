-- ============================================================
-- Migration: Dallas & Ingrid feedback (April 2026)
--
-- Applies concern/region changes based on CSA team feedback.
-- Only affects platform defaults (tenant_id IS NULL).
-- Tenant-customized data is NOT modified.
-- ============================================================

BEGIN;

-- ==========================================================
-- PART 1: Region Renames
-- ==========================================================

-- Rename female "Chest" -> "Breasts" (slug stays 'chest' for code compat)
UPDATE body_regions SET name = 'Breasts'
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000003';


-- ==========================================================
-- PART 2: New Body Region — Male Intimate
-- ==========================================================

INSERT INTO body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view)
SELECT 'b0000001-0000-0000-0000-000000000015', null, 'Intimate', 'intimate', 'male', 'body', 8, 'front'
WHERE NOT EXISTS (
  SELECT 1 FROM body_regions WHERE id = 'b0000001-0000-0000-0000-000000000015'
);

-- Shift male back/buttocks display_order to make room
UPDATE body_regions SET display_order = 9
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000008'; -- Back

UPDATE body_regions SET display_order = 10
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000009'; -- Buttocks

-- Concerns for male Intimate
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000015', 'Intimate Enhancement', 'intimate-enhancement', 1
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000015' AND slug = 'intimate-enhancement'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000015', 'Contouring', 'contouring', 2
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000015' AND slug = 'contouring'
);


-- ==========================================================
-- PART 3: Female Breasts (Chest) — Dallas A
-- ==========================================================

-- A1: Remove Micromastia
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'micromastia';

-- A2: Add "Sagging Breasts"
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Sagging Breasts', 'sagging-breasts', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'sagging-breasts'
);

-- A3: Add "Breast Reduction"
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Breast Reduction', 'breast-reduction', 11
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'breast-reduction'
);

-- A4: Add "Implant Exchange"
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Implant Exchange', 'implant-exchange', 12
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'implant-exchange'
);

-- A5: Remove Hyperpigmentation from Breasts
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'hyperpigmentation';

-- A6: Remove Acne from Breasts
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'acne';

-- A7: Add "Breast Removal / Top Surgery"
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Breast Removal / Top Surgery', 'breast-removal-top-surgery', 13
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'breast-removal-top-surgery'
);


-- ==========================================================
-- PART 4: Face — Eye concerns move Upper Face → Midface (Dallas B2)
-- ==========================================================

-- Delete eye concerns from Upper Face female (a..11)
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug IN ('hooded-eyelids', 'puffy-eyes', 'eye-bags');

-- Delete eye concerns from Upper Face male (b..10)
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug IN ('hooded-eyelids', 'puffy-eyes', 'eye-bags');

-- Add eye concerns to Midface female (a..12)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Hooded Eyelids', 'hooded-eyelids', 20
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'hooded-eyelids'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Puffy Eyes', 'puffy-eyes', 21
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'puffy-eyes'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Eye Bags', 'eye-bags', 22
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'eye-bags'
);

-- Add eye concerns to Midface male (b..11)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Hooded Eyelids', 'hooded-eyelids', 20
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'hooded-eyelids'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Puffy Eyes', 'puffy-eyes', 21
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'puffy-eyes'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Eye Bags', 'eye-bags', 22
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'eye-bags'
);


-- ==========================================================
-- PART 5: Midface — Remove/Merge/Add (Dallas B3-B8)
-- ==========================================================

-- B3: Remove Port Wine Stains (female midface only — male didn't have it)
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'port-wine-stains';

-- B4: Remove Freckles (female midface only — male didn't have it)
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'freckles';

-- B5: Add Wrinkles to Midface (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Wrinkles', 'wrinkles', 23
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'wrinkles'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Wrinkles', 'wrinkles', 23
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'wrinkles'
);

-- B6: Add Rhinoplasty to Midface (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Rhinoplasty', 'rhinoplasty', 24
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'rhinoplasty'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Rhinoplasty', 'rhinoplasty', 24
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'rhinoplasty'
);

-- B7: Add Septoplasty to Midface (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Septoplasty', 'septoplasty', 25
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'septoplasty'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Septoplasty', 'septoplasty', 25
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'septoplasty'
);

-- B8: Merge Rosacea + Melasma → "Skin Discoloration" (both genders)
-- Female midface: delete Rosacea and Melasma, add Skin Discoloration
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug IN ('rosacea', 'melasma');

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Skin Discoloration', 'skin-discoloration', 26
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'skin-discoloration'
);

-- Male midface: delete Rosacea, add Skin Discoloration
DELETE FROM concerns WHERE tenant_id IS NULL
  AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'rosacea';

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Skin Discoloration', 'skin-discoloration', 26
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'skin-discoloration'
);


-- ==========================================================
-- PART 6: Lower Face — Add Chin Implant (Dallas B9)
-- ==========================================================

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000013', 'Chin Implant', 'chin-implant', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000013' AND slug = 'chin-implant'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000012', 'Chin Implant', 'chin-implant', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000012' AND slug = 'chin-implant'
);


-- ==========================================================
-- PART 7: Flanks — Add concerns (Dallas C1/C2/C3/F1)
-- ==========================================================

-- Rib Contouring (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000004', 'Rib Contouring', 'rib-contouring', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000004' AND slug = 'rib-contouring'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000004', 'Rib Contouring', 'rib-contouring', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000004' AND slug = 'rib-contouring'
);

-- Waist Shaping (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000004', 'Waist Shaping', 'waist-shaping', 11
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000004' AND slug = 'waist-shaping'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000004', 'Waist Shaping', 'waist-shaping', 11
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000004' AND slug = 'waist-shaping'
);

-- Contouring (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000004', 'Contouring', 'contouring', 12
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000004' AND slug = 'contouring'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000004', 'Contouring', 'contouring', 12
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000004' AND slug = 'contouring'
);


-- ==========================================================
-- PART 8: Abdomen — Add concerns (Dallas D1/D2/D3)
-- ==========================================================

-- Tummy Tuck (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000001', 'Tummy Tuck', 'tummy-tuck', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000001' AND slug = 'tummy-tuck'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000001', 'Tummy Tuck', 'tummy-tuck', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000001' AND slug = 'tummy-tuck'
);

-- C-Section Scar (female only)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000001', 'C-Section Scar', 'c-section-scar', 11
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000001' AND slug = 'c-section-scar'
);

-- Liposuction (both genders)
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000001', 'Liposuction', 'liposuction', 12
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000001' AND slug = 'liposuction'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000001', 'Liposuction', 'liposuction', 11
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000001' AND slug = 'liposuction'
);


-- ==========================================================
-- PART 9: Male Chest — Add Breast Enhancement (Dallas E1)
-- ==========================================================

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000003', 'Breast Enhancement', 'breast-enhancement', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000003' AND slug = 'breast-enhancement'
);


-- ==========================================================
-- PART 10: Male Hands — Match female concerns (Dallas G1)
-- ==========================================================

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000005', 'Dry Skin', 'dry-skin', 10
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000005' AND slug = 'dry-skin'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000005', 'Fine Lines', 'fine-lines', 11
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000005' AND slug = 'fine-lines'
);


COMMIT;
