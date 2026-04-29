-- ============================================================
-- Seed: Platform default body regions and concerns
-- tenant_id = NULL means these are global defaults
-- ============================================================

-- ===================
-- BODY REGIONS — FEMALE
-- ===================

-- Female Body Front
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('a0000001-0000-0000-0000-000000000001', null, 'Abdomen', 'abdomen', 'female', 'body', 1, 'front'),
  ('a0000001-0000-0000-0000-000000000002', null, 'Arms', 'arms', 'female', 'body', 2, 'front'),
  ('a0000001-0000-0000-0000-000000000003', null, 'Breasts', 'chest', 'female', 'body', 3, 'front'),
  ('a0000001-0000-0000-0000-000000000004', null, 'Flanks', 'flanks', 'female', 'body', 4, 'front'),
  ('a0000001-0000-0000-0000-000000000005', null, 'Hands', 'hands', 'female', 'body', 5, 'front'),
  ('a0000001-0000-0000-0000-000000000006', null, 'Thighs', 'thighs', 'female', 'body', 6, 'front'),
  ('a0000001-0000-0000-0000-000000000007', null, 'Lower Legs', 'lower-legs', 'female', 'body', 7, 'front'),
  ('a0000001-0000-0000-0000-000000000008', null, 'Intimate', 'intimate', 'female', 'body', 8, 'front');

-- Female Body Back
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('a0000001-0000-0000-0000-000000000009', null, 'Back', 'back', 'female', 'body', 9, 'back'),
  ('a0000001-0000-0000-0000-000000000010', null, 'Buttocks', 'buttocks', 'female', 'body', 10, 'back');

-- Female Face
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('a0000001-0000-0000-0000-000000000011', null, 'Upper Face', 'upper-face', 'female', 'face', 1, 'face'),
  ('a0000001-0000-0000-0000-000000000012', null, 'Midface', 'midface', 'female', 'face', 2, 'face'),
  ('a0000001-0000-0000-0000-000000000013', null, 'Lower Face', 'lower-face', 'female', 'face', 3, 'face'),
  ('a0000001-0000-0000-0000-000000000014', null, 'Neck', 'neck', 'female', 'face', 4, 'face'),
  ('a0000001-0000-0000-0000-000000000015', null, 'Lips', 'lips', 'female', 'face', 5, 'face');

-- ===================
-- BODY REGIONS — MALE
-- ===================

-- Male Body Front
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('b0000001-0000-0000-0000-000000000001', null, 'Abdomen', 'abdomen', 'male', 'body', 1, 'front'),
  ('b0000001-0000-0000-0000-000000000002', null, 'Arms', 'arms', 'male', 'body', 2, 'front'),
  ('b0000001-0000-0000-0000-000000000003', null, 'Chest', 'chest', 'male', 'body', 3, 'front'),
  ('b0000001-0000-0000-0000-000000000004', null, 'Flanks', 'flanks', 'male', 'body', 4, 'front'),
  ('b0000001-0000-0000-0000-000000000005', null, 'Hands', 'hands', 'male', 'body', 5, 'front'),
  ('b0000001-0000-0000-0000-000000000006', null, 'Thighs', 'thighs', 'male', 'body', 6, 'front'),
  ('b0000001-0000-0000-0000-000000000007', null, 'Lower Legs', 'lower-legs', 'male', 'body', 7, 'front'),
  ('b0000001-0000-0000-0000-000000000015', null, 'Intimate', 'intimate', 'male', 'body', 8, 'front');

-- Male Body Back
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('b0000001-0000-0000-0000-000000000008', null, 'Back', 'back', 'male', 'body', 9, 'back'),
  ('b0000001-0000-0000-0000-000000000009', null, 'Buttocks', 'buttocks', 'male', 'body', 10, 'back');

-- Male Face
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('b0000001-0000-0000-0000-000000000010', null, 'Upper Face', 'upper-face', 'male', 'face', 1, 'face'),
  ('b0000001-0000-0000-0000-000000000011', null, 'Midface', 'midface', 'male', 'face', 2, 'face'),
  ('b0000001-0000-0000-0000-000000000012', null, 'Lower Face', 'lower-face', 'male', 'face', 3, 'face'),
  ('b0000001-0000-0000-0000-000000000013', null, 'Neck', 'neck', 'male', 'face', 4, 'face'),
  ('b0000001-0000-0000-0000-000000000014', null, 'Lips', 'lips', 'male', 'face', 5, 'face');


-- ===================
-- CONCERNS — FEMALE BODY
-- ===================

-- Abdomen (female)
-- WS4: Added "Tummy Tuck", "C-Section Scar", "Liposuction"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000001', 'Loose Skin', 'loose-skin', 1),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Excess Fat', 'excess-fat', 2),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Muscle Tone', 'muscle-tone', 3),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Stretch Marks', 'stretch-marks', 4),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Uneven Skin Texture', 'uneven-skin-texture', 5),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Tummy Tuck', 'tummy-tuck', 10),
  (null, 'a0000001-0000-0000-0000-000000000001', 'C-Section Scar', 'c-section-scar', 11),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Liposuction', 'liposuction', 12);

-- Arms (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000002', 'Upper Arm Laxity', 'upper-arm-laxity', 1),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Excess Fat', 'excess-fat', 3),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Hyperpigmentation', 'hyperpigmentation', 4);

-- Breasts (female, slug='chest')
-- WS4: Removed "Micromastia", "Acne", "Hyperpigmentation". Added "Sagging Breasts", "Breast Reduction", "Implant Exchange", "Breast Removal / Top Surgery"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000003', 'Breast Enhancement', 'breast-enhancement', 1),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Enlarged Areolas', 'enlarged-areolas', 3),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Breast Asymmetry', 'breast-asymmetry', 4),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Sagging Breasts', 'sagging-breasts', 10),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Breast Reduction', 'breast-reduction', 11),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Implant Exchange', 'implant-exchange', 12),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Breast Removal / Top Surgery', 'breast-removal-top-surgery', 13);

-- Flanks (female)
-- WS4: Added "Rib Contouring", "Waist Shaping", "Contouring"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000004', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000004', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000004', 'Rib Contouring', 'rib-contouring', 10),
  (null, 'a0000001-0000-0000-0000-000000000004', 'Waist Shaping', 'waist-shaping', 11),
  (null, 'a0000001-0000-0000-0000-000000000004', 'Contouring', 'contouring', 12);

-- Hands (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000005', 'Hyperpigmentation', 'hyperpigmentation', 1),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Dry Skin', 'dry-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Fine Lines', 'fine-lines', 3),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Veins', 'veins', 4);

-- Thighs (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000006', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Saddlebags', 'saddlebags', 2),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Loose Skin', 'loose-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Stretch Marks', 'stretch-marks', 4),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Veins', 'veins', 5),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Muscle Sculpting', 'muscle-sculpting', 6);

-- Lower Legs (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000007', 'Veins', 'veins', 1),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Broken Blood Vessels', 'broken-blood-vessels', 2),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Cherry Angiomas', 'cherry-angiomas', 3),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Dry Skin', 'dry-skin', 4),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Hyperpigmentation', 'hyperpigmentation', 5),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Muscle Sculpting', 'muscle-sculpting', 6);

-- Intimate (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000008', 'Vaginal Rejuvenation', 'vaginal-rejuvenation', 1),
  (null, 'a0000001-0000-0000-0000-000000000008', 'Labiaplasty', 'labiaplasty', 2);

-- Back (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000009', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Keloid Scars', 'keloid-scars', 3),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Uneven Skin Texture', 'uneven-skin-texture', 4),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Acne', 'acne', 5),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Hyperpigmentation', 'hyperpigmentation', 6),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Bra Roll', 'bra-roll', 7);

-- Buttocks (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000010', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000010', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000010', 'Stretch Marks', 'stretch-marks', 3),
  (null, 'a0000001-0000-0000-0000-000000000010', 'Butt Augmentation', 'butt-augmentation', 4),
  (null, 'a0000001-0000-0000-0000-000000000010', 'Contouring', 'contouring', 5);

-- ===================
-- CONCERNS — FEMALE FACE
-- ===================

-- Upper Face (female)
-- WS4: Moved eye concerns (Hooded Eyelids, Puffy Eyes, Eye Bags) to Midface
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000011', 'Wrinkles', 'wrinkles', 1),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Crow''s Feet', 'crows-feet', 2),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Frown Lines', 'frown-lines', 3),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Fine Lines', 'fine-lines', 4),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Hyperpigmentation', 'hyperpigmentation', 5),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Acne', 'acne', 6),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Acne Scarring', 'acne-scarring', 7);

-- Midface (female)
-- WS4: Removed Port Wine Stains, Freckles. Merged Rosacea+Melasma -> Skin Discoloration.
--       Moved in eye concerns. Added Wrinkles, Rhinoplasty, Septoplasty.
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000012', 'Loss of Facial Volume', 'loss-of-facial-volume', 1),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Nasolabial Folds', 'nasolabial-folds', 2),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Acne', 'acne', 3),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Acne Scarring', 'acne-scarring', 4),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Skin Discoloration', 'skin-discoloration', 5),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Broken Blood Vessels', 'broken-blood-vessels', 6),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Uneven Skin Texture', 'uneven-skin-texture', 7),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Facial Asymmetry', 'facial-asymmetry', 8),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Hooded Eyelids', 'hooded-eyelids', 20),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Puffy Eyes', 'puffy-eyes', 21),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Eye Bags', 'eye-bags', 22),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Wrinkles', 'wrinkles', 23),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Rhinoplasty', 'rhinoplasty', 24),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Septoplasty', 'septoplasty', 25);

-- Lower Face (female)
-- WS4: Added "Chin Implant"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000013', 'Jowls', 'jowls', 1),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Double Chin', 'double-chin', 2),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Loose Skin', 'loose-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Fine Lines', 'fine-lines', 4),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Wrinkles', 'wrinkles', 5),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Acne', 'acne', 6),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Acne Scarring', 'acne-scarring', 7),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Hyperpigmentation', 'hyperpigmentation', 8),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Broken Blood Vessels', 'broken-blood-vessels', 9),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Chin Implant', 'chin-implant', 10);

-- Neck (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000014', 'Platysmal Bands', 'platysmal-bands', 1),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Wrinkles', 'wrinkles', 3),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Double Chin', 'double-chin', 4),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Hyperpigmentation', 'hyperpigmentation', 5);

-- Lips (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000015', 'Lip Enhancement', 'lip-enhancement', 1),
  (null, 'a0000001-0000-0000-0000-000000000015', 'Thin Lips', 'thin-lips', 2),
  (null, 'a0000001-0000-0000-0000-000000000015', 'Fine Lines', 'fine-lines', 3);


-- ===================
-- CONCERNS — MALE BODY
-- ===================

-- Abdomen (male)
-- WS4: Added "Tummy Tuck", "Liposuction"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000001', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Muscle Tone', 'muscle-tone', 3),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Stretch Marks', 'stretch-marks', 4),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Tummy Tuck', 'tummy-tuck', 10),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Liposuction', 'liposuction', 11);

-- Arms (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000002', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000002', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000002', 'Hyperpigmentation', 'hyperpigmentation', 3);

-- Chest (male)
-- WS4: Added "Breast Enhancement"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000003', 'Gynecomastia', 'gynecomastia', 1),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Enlarged Areolas', 'enlarged-areolas', 2),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Excess Fat', 'excess-fat', 3),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Acne', 'acne', 4),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Hyperpigmentation', 'hyperpigmentation', 5),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Breast Enhancement', 'breast-enhancement', 10);

-- Flanks (male)
-- WS4: Added "Rib Contouring", "Waist Shaping", "Contouring"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000004', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000004', 'Rib Contouring', 'rib-contouring', 10),
  (null, 'b0000001-0000-0000-0000-000000000004', 'Waist Shaping', 'waist-shaping', 11),
  (null, 'b0000001-0000-0000-0000-000000000004', 'Contouring', 'contouring', 12);

-- Hands (male)
-- WS4: Added "Dry Skin", "Fine Lines" (match female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000005', 'Hyperpigmentation', 'hyperpigmentation', 1),
  (null, 'b0000001-0000-0000-0000-000000000005', 'Veins', 'veins', 2),
  (null, 'b0000001-0000-0000-0000-000000000005', 'Dry Skin', 'dry-skin', 10),
  (null, 'b0000001-0000-0000-0000-000000000005', 'Fine Lines', 'fine-lines', 11);

-- Thighs (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000006', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000006', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000006', 'Muscle Sculpting', 'muscle-sculpting', 3);

-- Lower Legs (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000007', 'Veins', 'veins', 1),
  (null, 'b0000001-0000-0000-0000-000000000007', 'Broken Blood Vessels', 'broken-blood-vessels', 2),
  (null, 'b0000001-0000-0000-0000-000000000007', 'Muscle Sculpting', 'muscle-sculpting', 3);

-- Intimate (male)
-- WS4: New region
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000015', 'Intimate Enhancement', 'intimate-enhancement', 1),
  (null, 'b0000001-0000-0000-0000-000000000015', 'Contouring', 'contouring', 2);

-- Back (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000008', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000008', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000008', 'Keloid Scars', 'keloid-scars', 3),
  (null, 'b0000001-0000-0000-0000-000000000008', 'Acne', 'acne', 4),
  (null, 'b0000001-0000-0000-0000-000000000008', 'Hyperpigmentation', 'hyperpigmentation', 5);

-- Buttocks (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000009', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000009', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000009', 'Butt Augmentation', 'butt-augmentation', 3),
  (null, 'b0000001-0000-0000-0000-000000000009', 'Contouring', 'contouring', 4);

-- ===================
-- CONCERNS — MALE FACE
-- ===================

-- Upper Face (male)
-- WS4: Moved eye concerns (Hooded Eyelids, Puffy Eyes, Eye Bags) to Midface
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000010', 'Wrinkles', 'wrinkles', 1),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Crow''s Feet', 'crows-feet', 2),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Frown Lines', 'frown-lines', 3),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Fine Lines', 'fine-lines', 4),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Acne', 'acne', 5),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Acne Scarring', 'acne-scarring', 6),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Hyperpigmentation', 'hyperpigmentation', 7);

-- Midface (male)
-- WS4: Removed Rosacea -> Skin Discoloration. Moved in eye concerns. Added Wrinkles, Rhinoplasty, Septoplasty.
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000011', 'Loss of Facial Volume', 'loss-of-facial-volume', 1),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Nasolabial Folds', 'nasolabial-folds', 2),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Acne', 'acne', 3),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Acne Scarring', 'acne-scarring', 4),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Skin Discoloration', 'skin-discoloration', 5),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Broken Blood Vessels', 'broken-blood-vessels', 6),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Uneven Skin Texture', 'uneven-skin-texture', 7),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Facial Asymmetry', 'facial-asymmetry', 8),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Hooded Eyelids', 'hooded-eyelids', 20),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Puffy Eyes', 'puffy-eyes', 21),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Eye Bags', 'eye-bags', 22),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Wrinkles', 'wrinkles', 23),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Rhinoplasty', 'rhinoplasty', 24),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Septoplasty', 'septoplasty', 25);

-- Lower Face (male)
-- WS4: Added "Chin Implant"
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000012', 'Jowls', 'jowls', 1),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Double Chin', 'double-chin', 2),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Loose Skin', 'loose-skin', 3),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Wrinkles', 'wrinkles', 4),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Acne', 'acne', 5),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Acne Scarring', 'acne-scarring', 6),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Hyperpigmentation', 'hyperpigmentation', 7),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Broken Blood Vessels', 'broken-blood-vessels', 8),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Chin Implant', 'chin-implant', 10);

-- Neck (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000013', 'Platysmal Bands', 'platysmal-bands', 1),
  (null, 'b0000001-0000-0000-0000-000000000013', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000013', 'Double Chin', 'double-chin', 3),
  (null, 'b0000001-0000-0000-0000-000000000013', 'Wrinkles', 'wrinkles', 4);

-- Lips (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000014', 'Lip Enhancement', 'lip-enhancement', 1),
  (null, 'b0000001-0000-0000-0000-000000000014', 'Thin Lips', 'thin-lips', 2),
  (null, 'b0000001-0000-0000-0000-000000000014', 'Fine Lines', 'fine-lines', 3);
