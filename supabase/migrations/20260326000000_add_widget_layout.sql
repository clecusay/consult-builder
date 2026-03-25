DO $$ BEGIN
  CREATE TYPE widget_layout AS ENUM ('split', 'guided');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS widget_layout widget_layout NOT NULL DEFAULT 'split';
