import { z } from 'zod';

export const tenantSlugSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only');

export const widgetConfigSchema = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  font_family: z.string().max(200).optional(),
  cta_text: z.string().max(100).optional(),
  success_message: z.string().max(500).optional(),
  redirect_url: z.string().url().nullable().optional(),
  webhook_url: z.string().url().nullable().optional(),
  webhook_secret: z.string().max(200).nullable().optional(),
  notification_emails: z.array(z.string().email()).optional(),
  allowed_origins: z.array(z.string().url()).optional(),
  custom_css: z.string().max(5000).nullable().optional(),
});

export const bodyRegionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  gender: z.enum(['female', 'male', 'all']),
  body_area: z.enum(['face', 'body']),
  display_order: z.number().int().min(0),
  hotspot_x: z.number().nullable().optional(),
  hotspot_y: z.number().nullable().optional(),
  diagram_view: z.enum(['front', 'back', 'face']).nullable().optional(),
  is_active: z.boolean().optional(),
});

export const concernSchema = z.object({
  body_region_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  display_order: z.number().int().min(0),
  is_active: z.boolean().optional(),
});

export const formFieldSchema = z.object({
  field_type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox', 'radio']),
  label: z.string().min(1).max(100),
  placeholder: z.string().max(200).nullable().optional(),
  options: z.array(z.string()).nullable().optional(),
  is_required: z.boolean().default(false),
  display_order: z.number().int().min(0),
});
