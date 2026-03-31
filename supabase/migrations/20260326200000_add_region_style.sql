-- Add region_style column to widget_configs
-- 'diagram' = interactive SVG body diagram (existing default)
-- 'cards' = card grid for body area selection

DO $$ BEGIN
  CREATE TYPE region_style AS ENUM ('diagram', 'cards');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS region_style region_style NOT NULL DEFAULT 'diagram';
