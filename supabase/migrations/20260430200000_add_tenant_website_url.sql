-- Add website_url to tenants for "Return to website" link in widget
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS website_url text;
