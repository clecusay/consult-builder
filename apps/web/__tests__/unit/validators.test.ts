import { describe, it, expect } from 'vitest';
import {
  tenantSlugSchema,
  widgetConfigSchema,
  bodyRegionSchema,
  concernSchema,
  formFieldSchema,
} from '@/lib/validators';

describe('tenantSlugSchema', () => {
  it('accepts valid slug', () => {
    expect(tenantSlugSchema.safeParse('sunrise-medical').success).toBe(true);
    expect(tenantSlugSchema.safeParse('abc123').success).toBe(true);
  });

  it('rejects too-short slug', () => {
    expect(tenantSlugSchema.safeParse('a').success).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(tenantSlugSchema.safeParse('MyClinic').success).toBe(false);
  });

  it('rejects spaces', () => {
    expect(tenantSlugSchema.safeParse('my clinic').success).toBe(false);
  });
});

describe('widgetConfigSchema', () => {
  it('accepts valid hex colors', () => {
    const result = widgetConfigSchema.safeParse({
      primary_color: '#ff0000',
      secondary_color: '#00ff00',
      accent_color: '#0000ff',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid hex color', () => {
    const result = widgetConfigSchema.safeParse({ primary_color: 'red' });
    expect(result.success).toBe(false);
  });

  it('rejects non-URL webhook_url', () => {
    const result = widgetConfigSchema.safeParse({ webhook_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts null for nullable fields', () => {
    const result = widgetConfigSchema.safeParse({
      redirect_url: null,
      webhook_url: null,
      custom_css: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    expect(widgetConfigSchema.safeParse({}).success).toBe(true);
  });
});

describe('bodyRegionSchema', () => {
  it('accepts valid body region', () => {
    const result = bodyRegionSchema.safeParse({
      name: 'Abdomen',
      slug: 'abdomen',
      gender: 'female',
      body_area: 'body',
      display_order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid gender', () => {
    const result = bodyRegionSchema.safeParse({
      name: 'Test',
      slug: 'test',
      gender: 'other',
      body_area: 'body',
      display_order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative display_order', () => {
    const result = bodyRegionSchema.safeParse({
      name: 'Test',
      slug: 'test',
      gender: 'female',
      body_area: 'body',
      display_order: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe('concernSchema', () => {
  it('accepts valid concern', () => {
    const result = concernSchema.safeParse({
      body_region_id: 'a0000001-0000-0000-0000-000000000001',
      name: 'Excess Fat',
      slug: 'excess-fat',
      display_order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid body_region_id', () => {
    const result = concernSchema.safeParse({
      body_region_id: 'not-uuid',
      name: 'Test',
      slug: 'test',
      display_order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('formFieldSchema', () => {
  it('accepts valid text field', () => {
    const result = formFieldSchema.safeParse({
      field_type: 'text',
      label: 'First Name',
      display_order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid field_type', () => {
    const result = formFieldSchema.safeParse({
      field_type: 'number',
      label: 'Age',
      display_order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('defaults is_required to false', () => {
    const result = formFieldSchema.safeParse({
      field_type: 'email',
      label: 'Email',
      display_order: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_required).toBe(false);
    }
  });
});
