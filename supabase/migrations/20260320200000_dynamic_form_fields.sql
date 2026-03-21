-- ============================================================
-- Migration: Add field_key to form_fields for dynamic form rendering
-- ============================================================

-- Add field_key column: identifies system fields (first_name, email, etc.)
-- NULL for custom/tenant-created fields
alter table public.form_fields
  add column field_key text;

-- Each system key can only appear once per tenant
create unique index idx_form_fields_tenant_key
  on public.form_fields (tenant_id, field_key)
  where field_key is not null;

-- Seed default system form fields for all existing tenants
insert into public.form_fields (tenant_id, field_key, field_type, label, placeholder, is_required, display_order)
select t.id, f.field_key, f.field_type, f.label, f.placeholder, f.is_required, f.display_order
from public.tenants t
cross join (values
  ('first_name',   'text',     'First Name',  'Jane',                true,  0),
  ('last_name',    'text',     'Last Name',   'Doe',                 true,  1),
  ('email',        'email',    'Email',       'jane@example.com',    true,  2),
  ('phone',        'phone',    'Phone',       '(555) 555-5555',      false, 3),
  ('sms_opt_in',   'checkbox', 'SMS Opt-In',  'I agree to receive SMS text messages with appointment reminders, promotions, and special offers. Message & data rates may apply. Reply STOP to unsubscribe.', false, 100),
  ('email_opt_in', 'checkbox', 'Email Opt-In','I would like to receive email updates including exclusive promotions, new treatment announcements, and helpful skincare tips. Unsubscribe anytime.', false, 101)
) as f(field_key, field_type, label, placeholder, is_required, display_order)
where not exists (
  select 1 from public.form_fields ff
  where ff.tenant_id = t.id and ff.field_key = f.field_key
);

-- Bump existing custom fields (field_key IS NULL) to order between contact and opt-in fields
update public.form_fields
set display_order = display_order + 10
where field_key is null
  and display_order < 10;
