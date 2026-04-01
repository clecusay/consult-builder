-- ============================================================
-- Migration: Add card_description and display_group to body_regions
-- ============================================================

BEGIN;

ALTER TABLE public.body_regions
  ADD COLUMN IF NOT EXISTS card_description text;

ALTER TABLE public.body_regions
  ADD COLUMN IF NOT EXISTS display_group text
  CHECK (display_group IN ('face', 'upper_body', 'lower_body'));

-- Populate display_group for platform defaults
UPDATE public.body_regions SET display_group = 'face'
WHERE tenant_id IS NULL AND body_area = 'face';

UPDATE public.body_regions SET display_group = 'face'
WHERE tenant_id IS NULL AND slug = 'neck';

UPDATE public.body_regions SET display_group = 'upper_body'
WHERE tenant_id IS NULL AND body_area = 'body'
  AND slug IN ('abdomen', 'arms', 'chest', 'flanks', 'hands', 'back');

UPDATE public.body_regions SET display_group = 'lower_body'
WHERE tenant_id IS NULL AND body_area = 'body'
  AND slug IN ('thighs', 'lower-legs', 'buttocks', 'intimate');

-- Populate default card_description for platform defaults
UPDATE public.body_regions SET card_description = 'Forehead, brow, temples' WHERE tenant_id IS NULL AND slug = 'upper-face';
UPDATE public.body_regions SET card_description = 'Cheeks, under-eyes, nose' WHERE tenant_id IS NULL AND slug = 'midface';
UPDATE public.body_regions SET card_description = 'Jawline, chin, jowls' WHERE tenant_id IS NULL AND slug = 'lower-face';
UPDATE public.body_regions SET card_description = 'Volume, shape, lines' WHERE tenant_id IS NULL AND slug = 'lips';
UPDATE public.body_regions SET card_description = 'Bands, laxity, contour' WHERE tenant_id IS NULL AND slug = 'neck';
UPDATE public.body_regions SET card_description = 'Tuck, lipo, skin tightening' WHERE tenant_id IS NULL AND slug = 'abdomen';
UPDATE public.body_regions SET card_description = 'Augmentation, lift, reduction' WHERE tenant_id IS NULL AND slug = 'chest';
UPDATE public.body_regions SET card_description = 'Love handles, contouring' WHERE tenant_id IS NULL AND slug = 'flanks';
UPDATE public.body_regions SET card_description = 'Lift, lipo, tightening' WHERE tenant_id IS NULL AND slug = 'arms';
UPDATE public.body_regions SET card_description = 'Volume, veins, skin quality' WHERE tenant_id IS NULL AND slug = 'hands';
UPDATE public.body_regions SET card_description = 'Inner, outer, lift, lipo' WHERE tenant_id IS NULL AND slug = 'thighs';
UPDATE public.body_regions SET card_description = 'Calves, ankles' WHERE tenant_id IS NULL AND slug = 'lower-legs';
UPDATE public.body_regions SET card_description = 'BBL, lift, contouring' WHERE tenant_id IS NULL AND slug = 'buttocks';
UPDATE public.body_regions SET card_description = 'Labiaplasty, rejuvenation' WHERE tenant_id IS NULL AND slug = 'intimate';
UPDATE public.body_regions SET card_description = 'Acne, posture, fat reduction' WHERE tenant_id IS NULL AND slug = 'back';

COMMIT;
