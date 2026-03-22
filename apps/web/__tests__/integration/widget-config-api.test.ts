import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GET } from '@/app/api/widget/config/route';
import {
  seedTestTenant,
  cleanupTestTenant,
  TEST_TENANT_ID,
  TEST_LOCATION_ID,
} from '../helpers/supabase';

describe('GET /api/widget/config (integration)', () => {
  beforeAll(async () => {
    await seedTestTenant();
  });

  afterAll(async () => {
    await cleanupTestTenant();
  });

  it('returns config for a valid tenant', async () => {
    const url = `http://localhost:3001/api/widget/config?tenant_id=${TEST_TENANT_ID}`;
    const response = await GET(new Request(url));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.tenant.id).toBe(TEST_TENANT_ID);
    expect(data.tenant.name).toBe('Test Clinic');
    expect(data.branding.primary_color).toBe('#000000');
    expect(data.widget_mode).toBe('regions_concerns');
    expect(data.diagram_type).toBe('full_body');
    expect(Array.isArray(data.regions)).toBe(true);
    expect(Array.isArray(data.form_fields)).toBe(true);
    expect(Array.isArray(data.locations)).toBe(true);
  });

  it('returns locations for the tenant', async () => {
    const url = `http://localhost:3001/api/widget/config?tenant_id=${TEST_TENANT_ID}`;
    const response = await GET(new Request(url));
    const data = await response.json();

    expect(data.locations.length).toBeGreaterThanOrEqual(1);
    const main = data.locations.find((l: { id: string }) => l.id === TEST_LOCATION_ID);
    expect(main).toBeDefined();
    expect(main.name).toBe('Main Office');
    expect(main.is_primary).toBe(true);
  });

  it('returns default form fields when none configured', async () => {
    const url = `http://localhost:3001/api/widget/config?tenant_id=${TEST_TENANT_ID}`;
    const response = await GET(new Request(url));
    const data = await response.json();

    // Should return default fields (first_name, last_name, email, phone, etc.)
    const fieldKeys = data.form_fields.map((f: { field_key: string }) => f.field_key);
    expect(fieldKeys).toContain('first_name');
    expect(fieldKeys).toContain('last_name');
    expect(fieldKeys).toContain('email');
  });

  it('returns platform-default body regions', async () => {
    const url = `http://localhost:3001/api/widget/config?tenant_id=${TEST_TENANT_ID}`;
    const response = await GET(new Request(url));
    const data = await response.json();

    // Regions come from platform defaults since test tenant has no overrides
    expect(data.regions.length).toBeGreaterThan(0);
    const slugs = data.regions.map((r: { slug: string }) => r.slug);
    expect(slugs).toContain('abdomen');
  });

  it('returns 400 for missing tenant_id', async () => {
    const url = 'http://localhost:3001/api/widget/config';
    const response = await GET(new Request(url));
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid UUID', async () => {
    const url = 'http://localhost:3001/api/widget/config?tenant_id=not-a-uuid';
    const response = await GET(new Request(url));
    expect(response.status).toBe(400);
  });

  it('returns 404 for non-existent tenant', async () => {
    const url = 'http://localhost:3001/api/widget/config?tenant_id=00000000-0000-0000-0000-000000000000';
    const response = await GET(new Request(url));
    expect(response.status).toBe(404);
  });

  it('returns 404 for invalid location', async () => {
    const url = `http://localhost:3001/api/widget/config?tenant_id=${TEST_TENANT_ID}&location=00000000-0000-0000-0000-000000000000`;
    const response = await GET(new Request(url));
    expect(response.status).toBe(404);
  });
});
