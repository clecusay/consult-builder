import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create the schema from the submit route to test it in isolation.
// This keeps unit tests decoupled from Next.js route internals.
const submissionSchema = z.object({
  tenant_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional(),
  gender: z.enum(['female', 'male', 'all']),
  selected_regions: z.array(
    z.object({
      region_id: z.string().uuid(),
      region_name: z.string(),
      region_slug: z.string(),
    })
  ).min(1, 'At least one body region must be selected'),
  selected_concerns: z.array(
    z.object({
      concern_id: z.string().uuid(),
      concern_name: z.string(),
      region_id: z.string().uuid(),
      region_name: z.string(),
    })
  ),
  selected_services: z.array(
    z.object({
      service_id: z.string().uuid(),
      service_name: z.string(),
      category_name: z.string(),
    })
  ).default([]),
  custom_fields: z.record(z.unknown()).default({}),
  sms_opt_in: z.boolean().optional(),
  email_opt_in: z.boolean().optional(),
  source_url: z.string().url().optional(),
});

const VALID_PAYLOAD = {
  tenant_id: 'a1abe023-e09f-4466-8a16-305f60e119bb',
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  gender: 'female' as const,
  selected_regions: [
    { region_id: 'a0000001-0000-0000-0000-000000000001', region_name: 'Abdomen', region_slug: 'abdomen' },
  ],
  selected_concerns: [],
};

describe('Submission Schema', () => {
  it('accepts a valid payload', () => {
    const result = submissionSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it('rejects empty first_name', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, first_name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors;
      expect(issues.first_name).toBeDefined();
    }
  });

  it('rejects empty last_name', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, last_name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, email: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects empty selected_regions array', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, selected_regions: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.flatten().fieldErrors;
      expect(issues.selected_regions).toBeDefined();
    }
  });

  it('rejects missing tenant_id', () => {
    const { tenant_id: _, ...noTenant } = VALID_PAYLOAD;
    const result = submissionSchema.safeParse(noTenant);
    expect(result.success).toBe(false);
  });

  it('rejects invalid tenant_id format', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, tenant_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid gender value', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, gender: 'other' });
    expect(result.success).toBe(false);
  });

  it('defaults selected_services to empty array', () => {
    const result = submissionSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.selected_services).toEqual([]);
    }
  });

  it('defaults custom_fields to empty object', () => {
    const result = submissionSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.custom_fields).toEqual({});
    }
  });

  it('accepts optional fields when provided', () => {
    const result = submissionSchema.safeParse({
      ...VALID_PAYLOAD,
      phone: '555-1234',
      location_id: 'b0000001-0000-0000-0000-000000000001',
      sms_opt_in: true,
      email_opt_in: false,
      source_url: 'https://example.com/page',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source_url', () => {
    const result = submissionSchema.safeParse({ ...VALID_PAYLOAD, source_url: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});
