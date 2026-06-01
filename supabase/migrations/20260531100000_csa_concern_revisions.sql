-- ============================================================
-- Migration: CSA concern revisions (May 2026)
--
-- Concern-only updates from the revised CSA catalog. No region
-- structure or region ordering changes (Ingrid's region order is
-- preserved), and no new face anchors — nose concerns stay under
-- Midface. Only affects platform defaults (tenant_id IS NULL).
-- Tenant-customized data is NOT modified.
-- ============================================================

BEGIN;

-- ==========================================================
-- PART 1: Terminology renames (patient-friendly labels)
-- Slugs change with the labels.
-- ==========================================================

-- Nasolabial Folds -> Smile Lines (Midface, both genders)
UPDATE concerns SET name = 'Smile Lines', slug = 'smile-lines'
WHERE tenant_id IS NULL AND slug = 'nasolabial-folds'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

-- Skin Discoloration -> Hyperpigmentation (Midface, both genders)
UPDATE concerns SET name = 'Hyperpigmentation', slug = 'hyperpigmentation'
WHERE tenant_id IS NULL AND slug = 'skin-discoloration'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

-- Rhinoplasty -> Nose Reshaping (Rhinoplasty) (Midface, both genders)
UPDATE concerns SET name = 'Nose Reshaping (Rhinoplasty)', slug = 'nose-reshaping-rhinoplasty'
WHERE tenant_id IS NULL AND slug = 'rhinoplasty'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

-- Septoplasty -> Deviated Septum Correction (Midface, both genders)
UPDATE concerns SET name = 'Deviated Septum Correction', slug = 'deviated-septum-correction'
WHERE tenant_id IS NULL AND slug = 'septoplasty'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

-- Platysmal Bands -> Neck Bands (Neck, both genders)
UPDATE concerns SET name = 'Neck Bands', slug = 'neck-bands'
WHERE tenant_id IS NULL AND slug = 'platysmal-bands'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000013');

-- Keloid Scars -> Raised Scars (Back, both genders)
UPDATE concerns SET name = 'Raised Scars', slug = 'raised-scars'
WHERE tenant_id IS NULL AND slug = 'keloid-scars'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000008');

-- Cherry Angiomas -> Red Spots (female Lower Legs)
UPDATE concerns SET name = 'Red Spots', slug = 'red-spots'
WHERE tenant_id IS NULL AND slug = 'cherry-angiomas'
  AND body_region_id = 'a0000001-0000-0000-0000-000000000007';

-- Gynecomastia -> Enlarged Male Breasts (male Chest)
UPDATE concerns SET name = 'Enlarged Male Breasts', slug = 'enlarged-male-breasts'
WHERE tenant_id IS NULL AND slug = 'gynecomastia'
  AND body_region_id = 'b0000001-0000-0000-0000-000000000003';


-- ==========================================================
-- PART 2: Eye concerns move Midface -> Upper Face
-- Moves the existing rows (slugs preserved, no CRM churn).
-- ==========================================================

UPDATE concerns
SET body_region_id = CASE WHEN body_region_id = 'a0000001-0000-0000-0000-000000000012'
                          THEN 'a0000001-0000-0000-0000-000000000011'
                          ELSE 'b0000001-0000-0000-0000-000000000010' END::uuid,
    display_order = 5
WHERE tenant_id IS NULL AND slug = 'hooded-eyelids'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

UPDATE concerns
SET body_region_id = CASE WHEN body_region_id = 'a0000001-0000-0000-0000-000000000012'
                          THEN 'a0000001-0000-0000-0000-000000000011'
                          ELSE 'b0000001-0000-0000-0000-000000000010' END::uuid,
    display_order = 6
WHERE tenant_id IS NULL AND slug = 'puffy-eyes'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

UPDATE concerns
SET body_region_id = CASE WHEN body_region_id = 'a0000001-0000-0000-0000-000000000012'
                          THEN 'a0000001-0000-0000-0000-000000000011'
                          ELSE 'b0000001-0000-0000-0000-000000000010' END::uuid,
    display_order = 7
WHERE tenant_id IS NULL AND slug = 'eye-bags'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');

-- Re-sequence existing Upper Face concerns after the eye block.
-- Female: Hyperpigmentation, Acne, Acne Scarring -> 8, 9, 10
UPDATE concerns SET display_order = 8
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug = 'hyperpigmentation';
UPDATE concerns SET display_order = 9
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug = 'acne';
UPDATE concerns SET display_order = 10
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug = 'acne-scarring';

-- Male: Acne, Acne Scarring, Hyperpigmentation -> 8, 9, 10
UPDATE concerns SET display_order = 8
WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'acne';
UPDATE concerns SET display_order = 9
WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'acne-scarring';
UPDATE concerns SET display_order = 10
WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'hyperpigmentation';

-- Remove the duplicate Wrinkles that lived in Midface (Upper Face already has it).
DELETE FROM concerns
WHERE tenant_id IS NULL AND slug = 'wrinkles'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000011');


-- ==========================================================
-- PART 3: Removals
-- ==========================================================

-- Upper Arm Laxity off female Arms; re-sequence remaining.
DELETE FROM concerns
WHERE tenant_id IS NULL AND slug = 'upper-arm-laxity'
  AND body_region_id = 'a0000001-0000-0000-0000-000000000002';

UPDATE concerns SET display_order = 1
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000002' AND slug = 'loose-skin';
UPDATE concerns SET display_order = 2
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000002' AND slug = 'excess-fat';
UPDATE concerns SET display_order = 3
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000002' AND slug = 'hyperpigmentation';

-- Double Chin off Neck (both genders) — stays available under Lower Face.
DELETE FROM concerns
WHERE tenant_id IS NULL AND slug = 'double-chin'
  AND body_region_id IN ('a0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000013');

-- Re-sequence Neck after removal.
-- Female Neck: Hyperpigmentation -> 4
UPDATE concerns SET display_order = 4
WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000014' AND slug = 'hyperpigmentation';
-- Male Neck: Wrinkles -> 3
UPDATE concerns SET display_order = 3
WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000013' AND slug = 'wrinkles';


-- ==========================================================
-- PART 4: Additions — male Lower Legs (match female skin concerns)
-- ==========================================================

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000007', 'Hyperpigmentation', 'hyperpigmentation', 3
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000007' AND slug = 'hyperpigmentation'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000007', 'Dry Skin', 'dry-skin', 4
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000007' AND slug = 'dry-skin'
);

UPDATE concerns SET display_order = 5
WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000007' AND slug = 'muscle-sculpting';

COMMIT;
