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
  ('a0000001-0000-0000-0000-000000000003', null, 'Chest', 'chest', 'female', 'body', 3, 'front'),
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
  ('b0000001-0000-0000-0000-000000000007', null, 'Lower Legs', 'lower-legs', 'male', 'body', 7, 'front');

-- Male Body Back
insert into public.body_regions (id, tenant_id, name, slug, gender, body_area, display_order, diagram_view) values
  ('b0000001-0000-0000-0000-000000000008', null, 'Back', 'back', 'male', 'body', 8, 'back'),
  ('b0000001-0000-0000-0000-000000000009', null, 'Buttocks', 'buttocks', 'male', 'body', 9, 'back');

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
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000001', 'Crepey/Aging Skin', 'crepey-aging-skin', 1),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Excess Fat', 'excess-fat', 3),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Muscle Tone', 'muscle-tone', 4),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Muffin Top', 'muffin-top', 5),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Stretch Marks', 'stretch-marks', 6),
  (null, 'a0000001-0000-0000-0000-000000000001', 'Uneven Skin Texture', 'uneven-skin-texture', 7);

-- Arms (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000002', 'Batwings', 'batwings', 1),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Crepey/Aging Skin', 'crepey-aging-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Loose Skin', 'loose-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Excess Fat', 'excess-fat', 4),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Brown Spots', 'brown-spots', 5),
  (null, 'a0000001-0000-0000-0000-000000000002', 'Dry Skin', 'dry-skin', 6);

-- Chest (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000003', 'Flat Breasts', 'flat-breasts', 1),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Micromastia', 'micromastia', 2),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Sagging Skin', 'sagging-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Enlarged Areolas', 'enlarged-areolas', 4),
  (null, 'a0000001-0000-0000-0000-000000000003', 'Crepey/Aging Skin', 'crepey-aging-skin', 5);

-- Flanks (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000004', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000004', 'Muffin Top', 'muffin-top', 2),
  (null, 'a0000001-0000-0000-0000-000000000004', 'Loose Skin', 'loose-skin', 3);

-- Hands (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000005', 'Brown Spots', 'brown-spots', 1),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Crepey/Aging Skin', 'crepey-aging-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Dry Skin', 'dry-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Fine Lines', 'fine-lines', 4),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Sunspots', 'sunspots', 5),
  (null, 'a0000001-0000-0000-0000-000000000005', 'Veins', 'veins', 6);

-- Thighs (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000006', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Saddlebags', 'saddlebags', 2),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Loose Skin', 'loose-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Crepey/Aging Skin', 'crepey-aging-skin', 4),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Stretch Marks', 'stretch-marks', 5),
  (null, 'a0000001-0000-0000-0000-000000000006', 'Veins', 'veins', 6);

-- Lower Legs (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000007', 'Veins', 'veins', 1),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Broken Blood Vessels', 'broken-blood-vessels', 2),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Cherry Angiomas', 'cherry-angiomas', 3),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Dry Skin', 'dry-skin', 4),
  (null, 'a0000001-0000-0000-0000-000000000007', 'Brown Spots', 'brown-spots', 5);

-- Intimate (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000008', 'Vaginal Rejuvenation', 'vaginal-rejuvenation', 1);

-- Back (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000009', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Loose Skin', 'loose-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Keloid Scars', 'keloid-scars', 3),
  (null, 'a0000001-0000-0000-0000-000000000009', 'Uneven Skin Texture', 'uneven-skin-texture', 4);

-- Buttocks (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000010', 'Excess Fat', 'excess-fat', 1),
  (null, 'a0000001-0000-0000-0000-000000000010', 'Sagging Skin', 'sagging-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000010', 'Stretch Marks', 'stretch-marks', 3);

-- ===================
-- CONCERNS — FEMALE FACE
-- ===================

-- Upper Face (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000011', 'Wrinkles', 'wrinkles', 1),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Crow''s Feet', 'crows-feet', 2),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Frown Lines', 'frown-lines', 3),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Hooded Eyelids', 'hooded-eyelids', 4),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Puffy Eyes', 'puffy-eyes', 5),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Fine Lines', 'fine-lines', 6),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Brown Spots', 'brown-spots', 7),
  (null, 'a0000001-0000-0000-0000-000000000011', 'Hyperpigmentation', 'hyperpigmentation', 8);

-- Midface (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000012', 'Loss of Facial Volume', 'loss-of-facial-volume', 1),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Nasolabial Folds', 'nasolabial-folds', 2),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Acne', 'acne', 3),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Acne Scarring', 'acne-scarring', 4),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Melasma', 'melasma', 5),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Rosacea', 'rosacea', 6),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Broken Blood Vessels', 'broken-blood-vessels', 7),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Freckles', 'freckles', 8),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Sunspots', 'sunspots', 9),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Port Wine Stains', 'port-wine-stains', 10),
  (null, 'a0000001-0000-0000-0000-000000000012', 'Uneven Skin Texture', 'uneven-skin-texture', 11);

-- Lower Face (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000013', 'Jowls', 'jowls', 1),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Double Chin', 'double-chin', 2),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Sagging Skin', 'sagging-skin', 3),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Fine Lines', 'fine-lines', 4),
  (null, 'a0000001-0000-0000-0000-000000000013', 'Wrinkles', 'wrinkles', 5);

-- Neck (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000014', 'Platysmal Bands', 'platysmal-bands', 1),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Sagging Skin', 'sagging-skin', 2),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Wrinkles', 'wrinkles', 3),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Double Chin', 'double-chin', 4),
  (null, 'a0000001-0000-0000-0000-000000000014', 'Brown Spots', 'brown-spots', 5);

-- Lips (female)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'a0000001-0000-0000-0000-000000000015', 'Lip Enhancement', 'lip-enhancement', 1),
  (null, 'a0000001-0000-0000-0000-000000000015', 'Thin Lips', 'thin-lips', 2),
  (null, 'a0000001-0000-0000-0000-000000000015', 'Fine Lines', 'fine-lines', 3);


-- ===================
-- CONCERNS — MALE BODY
-- ===================

-- Abdomen (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000001', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Muscle Tone', 'muscle-tone', 3),
  (null, 'b0000001-0000-0000-0000-000000000001', 'Stretch Marks', 'stretch-marks', 4);

-- Arms (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000002', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000002', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000002', 'Crepey/Aging Skin', 'crepey-aging-skin', 3);

-- Chest (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000003', 'Gynecomastia', 'gynecomastia', 1),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Enlarged Areolas', 'enlarged-areolas', 2),
  (null, 'b0000001-0000-0000-0000-000000000003', 'Excess Fat', 'excess-fat', 3);

-- Flanks (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000004', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000004', 'Muffin Top', 'muffin-top', 2);

-- Hands (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000005', 'Brown Spots', 'brown-spots', 1),
  (null, 'b0000001-0000-0000-0000-000000000005', 'Crepey/Aging Skin', 'crepey-aging-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000005', 'Veins', 'veins', 3);

-- Thighs (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000006', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000006', 'Loose Skin', 'loose-skin', 2);

-- Lower Legs (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000007', 'Veins', 'veins', 1),
  (null, 'b0000001-0000-0000-0000-000000000007', 'Broken Blood Vessels', 'broken-blood-vessels', 2);

-- Back (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000008', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000008', 'Loose Skin', 'loose-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000008', 'Keloid Scars', 'keloid-scars', 3);

-- Buttocks (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000009', 'Excess Fat', 'excess-fat', 1),
  (null, 'b0000001-0000-0000-0000-000000000009', 'Sagging Skin', 'sagging-skin', 2);

-- ===================
-- CONCERNS — MALE FACE
-- ===================

-- Upper Face (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000010', 'Wrinkles', 'wrinkles', 1),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Crow''s Feet', 'crows-feet', 2),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Frown Lines', 'frown-lines', 3),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Hooded Eyelids', 'hooded-eyelids', 4),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Puffy Eyes', 'puffy-eyes', 5),
  (null, 'b0000001-0000-0000-0000-000000000010', 'Fine Lines', 'fine-lines', 6);

-- Midface (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000011', 'Loss of Facial Volume', 'loss-of-facial-volume', 1),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Nasolabial Folds', 'nasolabial-folds', 2),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Acne', 'acne', 3),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Acne Scarring', 'acne-scarring', 4),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Rosacea', 'rosacea', 5),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Broken Blood Vessels', 'broken-blood-vessels', 6),
  (null, 'b0000001-0000-0000-0000-000000000011', 'Uneven Skin Texture', 'uneven-skin-texture', 7);

-- Lower Face (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000012', 'Jowls', 'jowls', 1),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Double Chin', 'double-chin', 2),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Sagging Skin', 'sagging-skin', 3),
  (null, 'b0000001-0000-0000-0000-000000000012', 'Wrinkles', 'wrinkles', 4);

-- Neck (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000013', 'Platysmal Bands', 'platysmal-bands', 1),
  (null, 'b0000001-0000-0000-0000-000000000013', 'Sagging Skin', 'sagging-skin', 2),
  (null, 'b0000001-0000-0000-0000-000000000013', 'Double Chin', 'double-chin', 3),
  (null, 'b0000001-0000-0000-0000-000000000013', 'Wrinkles', 'wrinkles', 4);

-- Lips (male)
insert into public.concerns (tenant_id, body_region_id, name, slug, display_order) values
  (null, 'b0000001-0000-0000-0000-000000000014', 'Lip Enhancement', 'lip-enhancement', 1),
  (null, 'b0000001-0000-0000-0000-000000000014', 'Thin Lips', 'thin-lips', 2),
  (null, 'b0000001-0000-0000-0000-000000000014', 'Fine Lines', 'fine-lines', 3);
