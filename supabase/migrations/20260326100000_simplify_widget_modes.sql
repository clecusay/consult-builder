-- Simplify widget modes: remove regions_concerns_services, concerns_only, services_only
-- Add treatment_builder mode
-- Remaining modes: regions_services, regions_concerns, treatment_builder

-- Step 1: Migrate any tenants on removed modes to regions_concerns
UPDATE widget_configs
SET widget_mode = 'regions_concerns'
WHERE widget_mode IN ('regions_concerns_services', 'concerns_only', 'services_only');

-- Step 2: Drop the default before swapping the enum type
ALTER TABLE widget_configs
  ALTER COLUMN widget_mode DROP DEFAULT;

-- Step 3: Recreate the enum with only the valid modes
ALTER TYPE widget_mode RENAME TO widget_mode_old;

CREATE TYPE widget_mode AS ENUM (
  'regions_services',
  'regions_concerns',
  'treatment_builder'
);

ALTER TABLE widget_configs
  ALTER COLUMN widget_mode TYPE widget_mode
  USING widget_mode::text::widget_mode;

DROP TYPE widget_mode_old;

-- Step 4: Re-add the default
ALTER TABLE widget_configs
  ALTER COLUMN widget_mode SET DEFAULT 'regions_concerns';
