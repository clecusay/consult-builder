-- ============================================================
-- Migration: Add 'location' to form_fields field_type check constraint
-- ============================================================

alter table public.form_fields
  drop constraint form_fields_field_type_check;

alter table public.form_fields
  add constraint form_fields_field_type_check
  check (field_type in ('text', 'email', 'phone', 'date', 'textarea', 'select', 'checkbox', 'radio', 'location'));
