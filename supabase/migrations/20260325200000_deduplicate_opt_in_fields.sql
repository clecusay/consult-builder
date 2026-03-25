-- ============================================================
-- Clean up duplicate opt-in form fields.
-- Keeps the row with a proper field_key; removes rows that
-- match by label only (field_key IS NULL).
-- ============================================================

DELETE FROM form_fields
WHERE id IN (
  SELECT f.id
  FROM form_fields f
  WHERE f.field_key IS NULL
    AND lower(f.label) IN ('sms opt-in', 'email opt-in')
    AND EXISTS (
      SELECT 1 FROM form_fields f2
      WHERE f2.tenant_id = f.tenant_id
        AND f2.field_key IN ('sms_opt_in', 'email_opt_in')
    )
);
