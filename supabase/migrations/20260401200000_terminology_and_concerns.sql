-- ============================================================
-- Migration: Terminology updates and new concerns
--
-- Applies WS1/WS2/WS3 concern changes to EXISTING databases.
-- Only affects platform defaults (tenant_id IS NULL).
-- Tenant-customized concerns are NOT modified.
-- ============================================================

BEGIN;

-- ==========================================================
-- PART 1: Terminology — Renames
-- ==========================================================

-- Rename "Batwings" -> "Upper Arm Laxity"
UPDATE concerns SET name = 'Upper Arm Laxity', slug = 'upper-arm-laxity'
WHERE tenant_id IS NULL AND slug = 'batwings';

-- Rename "Flat Breasts" -> "Breast Enhancement"
UPDATE concerns SET name = 'Breast Enhancement', slug = 'breast-enhancement'
WHERE tenant_id IS NULL AND slug = 'flat-breasts';

-- Rename "Brown Spots" -> "Hyperpigmentation" (skip if region already has a hyperpigmentation row)
UPDATE concerns SET name = 'Hyperpigmentation', slug = 'hyperpigmentation'
WHERE tenant_id IS NULL AND slug = 'brown-spots'
  AND body_region_id NOT IN (
    SELECT body_region_id FROM concerns WHERE tenant_id IS NULL AND slug = 'hyperpigmentation'
  );

-- Delete remaining "Brown Spots" where "Hyperpigmentation" already existed (e.g. upper-face female)
DELETE FROM concerns WHERE tenant_id IS NULL AND slug = 'brown-spots';

-- Rename "Sagging Skin" -> "Loose Skin" (skip if region already has a loose-skin row)
UPDATE concerns SET name = 'Loose Skin', slug = 'loose-skin'
WHERE tenant_id IS NULL AND slug = 'sagging-skin'
  AND body_region_id NOT IN (
    SELECT body_region_id FROM concerns WHERE tenant_id IS NULL AND slug = 'loose-skin'
  );

-- Delete remaining "Sagging Skin" where "Loose Skin" already existed
DELETE FROM concerns WHERE tenant_id IS NULL AND slug = 'sagging-skin';


-- ==========================================================
-- PART 2: Terminology — Deletions
-- ==========================================================

-- Remove "Crepey/Aging Skin" (redundant with Loose Skin)
DELETE FROM concerns WHERE tenant_id IS NULL AND slug = 'crepey-aging-skin';

-- Remove "Muffin Top" (redundant with Excess Fat)
DELETE FROM concerns WHERE tenant_id IS NULL AND slug = 'muffin-top';

-- Remove "Sunspots" (consolidated into Hyperpigmentation)
DELETE FROM concerns WHERE tenant_id IS NULL AND slug = 'sunspots';

-- Remove "Dry Skin" from Arms female specifically
DELETE FROM concerns WHERE tenant_id IS NULL AND slug = 'dry-skin'
  AND body_region_id = 'a0000001-0000-0000-0000-000000000002';


-- ==========================================================
-- PART 3: Add Missing Facial / Body Concerns (WS2)
-- ==========================================================

-- Upper Face female (a0000001-...-11): Acne, Acne Scarring
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000011', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000011', 'Acne Scarring', 'acne-scarring', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug = 'acne-scarring'
);

-- Lower Face female (a0000001-...-13): Acne, Acne Scarring, Hyperpigmentation, Broken Blood Vessels
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000013', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000013' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000013', 'Acne Scarring', 'acne-scarring', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000013' AND slug = 'acne-scarring'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000013', 'Hyperpigmentation', 'hyperpigmentation', 102
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000013' AND slug = 'hyperpigmentation'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000013', 'Broken Blood Vessels', 'broken-blood-vessels', 103
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000013' AND slug = 'broken-blood-vessels'
);

-- Upper Face male (b0000001-...-10): Acne, Acne Scarring, Hyperpigmentation
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000010', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000010', 'Acne Scarring', 'acne-scarring', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'acne-scarring'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000010', 'Hyperpigmentation', 'hyperpigmentation', 102
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'hyperpigmentation'
);

-- Lower Face male (b0000001-...-12): Acne, Acne Scarring, Hyperpigmentation, Broken Blood Vessels
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000012', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000012' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000012', 'Acne Scarring', 'acne-scarring', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000012' AND slug = 'acne-scarring'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000012', 'Hyperpigmentation', 'hyperpigmentation', 102
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000012' AND slug = 'hyperpigmentation'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000012', 'Broken Blood Vessels', 'broken-blood-vessels', 103
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000012' AND slug = 'broken-blood-vessels'
);

-- Back female (a0000001-...-09): Acne, Hyperpigmentation
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000009', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000009' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000009', 'Hyperpigmentation', 'hyperpigmentation', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000009' AND slug = 'hyperpigmentation'
);

-- Back male (b0000001-...-08): Acne, Hyperpigmentation
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000008', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000008' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000008', 'Hyperpigmentation', 'hyperpigmentation', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000008' AND slug = 'hyperpigmentation'
);

-- Chest female (a0000001-...-03): Acne, Hyperpigmentation
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Hyperpigmentation', 'hyperpigmentation', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'hyperpigmentation'
);

-- Chest male (b0000001-...-03): Acne, Hyperpigmentation
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000003', 'Acne', 'acne', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000003' AND slug = 'acne'
);

INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000003', 'Hyperpigmentation', 'hyperpigmentation', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000003' AND slug = 'hyperpigmentation'
);

-- Arms male (b0000001-...-02): Hyperpigmentation
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000002', 'Hyperpigmentation', 'hyperpigmentation', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000002' AND slug = 'hyperpigmentation'
);


-- ==========================================================
-- PART 4: Add New Concerns (WS3)
-- ==========================================================

-- Eye Bags -> Upper Face female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000011', 'Eye Bags', 'eye-bags', 102
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000011' AND slug = 'eye-bags'
);

-- Eye Bags -> Upper Face male
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000010', 'Eye Bags', 'eye-bags', 103
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000010' AND slug = 'eye-bags'
);

-- Facial Asymmetry -> Midface female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000012', 'Facial Asymmetry', 'facial-asymmetry', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000012' AND slug = 'facial-asymmetry'
);

-- Facial Asymmetry -> Midface male
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000011', 'Facial Asymmetry', 'facial-asymmetry', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000011' AND slug = 'facial-asymmetry'
);

-- Breast Asymmetry -> Chest female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000003', 'Breast Asymmetry', 'breast-asymmetry', 102
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000003' AND slug = 'breast-asymmetry'
);

-- Labiaplasty -> Intimate female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000008', 'Labiaplasty', 'labiaplasty', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000008' AND slug = 'labiaplasty'
);

-- Bra Roll -> Back female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000009', 'Bra Roll', 'bra-roll', 102
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000009' AND slug = 'bra-roll'
);

-- Butt Augmentation -> Buttocks female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000010', 'Butt Augmentation', 'butt-augmentation', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000010' AND slug = 'butt-augmentation'
);

-- Contouring -> Buttocks female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000010', 'Contouring', 'contouring', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000010' AND slug = 'contouring'
);

-- Butt Augmentation -> Buttocks male
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000009', 'Butt Augmentation', 'butt-augmentation', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000009' AND slug = 'butt-augmentation'
);

-- Contouring -> Buttocks male
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000009', 'Contouring', 'contouring', 101
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000009' AND slug = 'contouring'
);

-- Muscle Sculpting -> Thighs female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000006', 'Muscle Sculpting', 'muscle-sculpting', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000006' AND slug = 'muscle-sculpting'
);

-- Muscle Sculpting -> Thighs male
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000006', 'Muscle Sculpting', 'muscle-sculpting', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000006' AND slug = 'muscle-sculpting'
);

-- Muscle Sculpting -> Lower Legs female
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'a0000001-0000-0000-0000-000000000007', 'Muscle Sculpting', 'muscle-sculpting', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'a0000001-0000-0000-0000-000000000007' AND slug = 'muscle-sculpting'
);

-- Muscle Sculpting -> Lower Legs male
INSERT INTO concerns (tenant_id, body_region_id, name, slug, display_order)
SELECT null, 'b0000001-0000-0000-0000-000000000007', 'Muscle Sculpting', 'muscle-sculpting', 100
WHERE NOT EXISTS (
  SELECT 1 FROM concerns WHERE tenant_id IS NULL AND body_region_id = 'b0000001-0000-0000-0000-000000000007' AND slug = 'muscle-sculpting'
);

COMMIT;
