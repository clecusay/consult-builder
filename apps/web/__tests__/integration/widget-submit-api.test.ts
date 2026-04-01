import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST } from '@/app/api/widget/submit/route';
import {
  seedTestTenant,
  cleanupTestTenant,
  getServiceClient,
  TEST_TENANT_ID,
  TEST_LOCATION_ID,
  SEED,
} from '../helpers/supabase';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost:3001/api/widget/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_SUBMISSION = {
  tenant_id: TEST_TENANT_ID,
  first_name: 'Integration',
  last_name: 'Test',
  email: 'integration@test.com',
  gender: 'female',
  selected_regions: [
    {
      region_id: SEED.femaleAbdomen,
      region_name: 'Abdomen',
      region_slug: 'abdomen',
    },
  ],
  selected_concerns: [],
};

describe('POST /api/widget/submit (integration)', () => {
  beforeAll(async () => {
    await seedTestTenant();
  });

  afterAll(async () => {
    await cleanupTestTenant();
  });

  it('creates a submission for a valid payload', async () => {
    const response = await POST(makeRequest(VALID_SUBMISSION));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();

    // Verify it was persisted
    const db = getServiceClient();
    const { data: row } = await db
      .from('form_submissions')
      .select('*')
      .eq('id', data.id)
      .single();

    expect(row).not.toBeNull();
    expect(row!.first_name).toBe('Integration');
    expect(row!.email).toBe('integration@test.com');
    expect(row!.lead_status).toBe('new');
  });

  it('accepts submission with location_id', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      location_id: TEST_LOCATION_ID,
    }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('rejects empty first_name', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      first_name: '',
    }));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Please check your submission and try again.');
  });

  it('rejects empty email', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      email: '',
    }));
    expect(response.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      email: 'bad-email',
    }));
    expect(response.status).toBe(400);
  });

  it('rejects empty selected_regions', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      selected_regions: [],
    }));
    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent tenant', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      tenant_id: '00000000-0000-0000-0000-000000000000',
    }));
    expect(response.status).toBe(404);
  });

  it('rejects location_id that belongs to a different tenant', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      location_id: '00000000-0000-0000-0000-000000000099',
    }));
    expect(response.status).toBe(400);
  });

  it('stores optional fields correctly', async () => {
    const response = await POST(makeRequest({
      ...VALID_SUBMISSION,
      email: 'optional-fields@test.com',
      phone: '555-0123',
      sms_opt_in: true,
      email_opt_in: false,
      source_url: 'https://example.com/test-page',
    }));
    const data = await response.json();
    expect(response.status).toBe(200);

    const db = getServiceClient();
    const { data: row } = await db
      .from('form_submissions')
      .select('*')
      .eq('id', data.id)
      .single();

    expect(row!.phone).toBe('555-0123');
    expect(row!.source_url).toBe('https://example.com/test-page');
    expect(row!.custom_fields['SMS Opt-In']).toBe(true);
    expect(row!.custom_fields['Email Opt-In']).toBe(false);
  });
});
