-- ============================================================
-- Migration: Ingrid UX feedback (April 2026)
--
-- Reorder body regions anatomically (top-to-bottom) instead
-- of alphabetically. Only affects platform defaults.
-- ============================================================

BEGIN;

-- ==========================================================
-- Female Body — anatomical order (top to bottom)
-- ==========================================================

-- Breasts (chest slug) = 1
UPDATE body_regions SET display_order = 1
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000003';

-- Arms = 2
UPDATE body_regions SET display_order = 2
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000002';

-- Flanks = 3
UPDATE body_regions SET display_order = 3
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000004';

-- Abdomen = 4
UPDATE body_regions SET display_order = 4
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000001';

-- Hands = 5
UPDATE body_regions SET display_order = 5
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000005';

-- Intimate = 6
UPDATE body_regions SET display_order = 6
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000008';

-- Buttocks = 7
UPDATE body_regions SET display_order = 7
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000010';

-- Thighs = 8
UPDATE body_regions SET display_order = 8
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000006';

-- Lower Legs = 9
UPDATE body_regions SET display_order = 9
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000007';

-- Back = 10
UPDATE body_regions SET display_order = 10
WHERE tenant_id IS NULL AND id = 'a0000001-0000-0000-0000-000000000009';


-- ==========================================================
-- Male Body — anatomical order (top to bottom)
-- ==========================================================

-- Chest = 1
UPDATE body_regions SET display_order = 1
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000003';

-- Arms = 2
UPDATE body_regions SET display_order = 2
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000002';

-- Flanks = 3
UPDATE body_regions SET display_order = 3
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000004';

-- Abdomen = 4
UPDATE body_regions SET display_order = 4
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000001';

-- Hands = 5
UPDATE body_regions SET display_order = 5
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000005';

-- Intimate = 6
UPDATE body_regions SET display_order = 6
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000015';

-- Buttocks = 7
UPDATE body_regions SET display_order = 7
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000009';

-- Thighs = 8
UPDATE body_regions SET display_order = 8
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000006';

-- Lower Legs = 9
UPDATE body_regions SET display_order = 9
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000007';

-- Back = 10
UPDATE body_regions SET display_order = 10
WHERE tenant_id IS NULL AND id = 'b0000001-0000-0000-0000-000000000008';

COMMIT;
