import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

/**
 * Returns a Supabase service-role client for test setup/teardown.
 * Bypasses RLS so tests can directly insert and clean up data.
 */
export function getServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
        'Ensure .env.local is configured and local Supabase is running.'
      );
    }
    serviceClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceClient;
}

/** Fixed test tenant ID used across integration tests. */
export const TEST_TENANT_ID = 'e2e00000-0000-0000-0000-000000000001';
export const TEST_TENANT_SLUG = 'test-clinic';
export const TEST_LOCATION_ID = 'e2e00000-0000-0000-0000-000000000010';

/** Known platform-default body region IDs from seed.sql */
export const SEED = {
  femaleAbdomen: 'a0000001-0000-0000-0000-000000000001',
  femaleArms: 'a0000001-0000-0000-0000-000000000002',
  femaleUpperFace: 'a0000001-0000-0000-0000-000000000011',
  maleLips: 'b0000001-0000-0000-0000-000000000014',
} as const;

/**
 * Creates a test tenant, location, and widget config in the database.
 * Call this in `beforeAll` for integration tests.
 */
export async function seedTestTenant() {
  const db = getServiceClient();

  // Tenant
  await db.from('tenants').upsert({
    id: TEST_TENANT_ID,
    name: 'Test Clinic',
    slug: TEST_TENANT_SLUG,
    status: 'active',
    billing_plan: 'free',
  });

  // Location
  await db.from('tenant_locations').upsert({
    id: TEST_LOCATION_ID,
    tenant_id: TEST_TENANT_ID,
    name: 'Main Office',
    city: 'Testville',
    state: 'TX',
    is_primary: true,
  });

  // Widget config
  await db.from('widget_configs').upsert({
    tenant_id: TEST_TENANT_ID,
    primary_color: '#000000',
    secondary_color: '#ffffff',
    accent_color: '#0066ff',
    font_family: 'Inter',
    cta_text: 'Book Now',
    success_message: 'Thank you!',
    widget_mode: 'regions_concerns',
    diagram_type: 'full_body',
    notification_emails: [],
    allowed_origins: [],
  }, { onConflict: 'tenant_id' });
}

/**
 * Removes test data created by seedTestTenant().
 * Call this in `afterAll` for integration tests.
 */
export async function cleanupTestTenant() {
  const db = getServiceClient();

  // Delete in FK order
  await db.from('form_submissions').delete().eq('tenant_id', TEST_TENANT_ID);
  await db.from('widget_configs').delete().eq('tenant_id', TEST_TENANT_ID);
  await db.from('tenant_locations').delete().eq('tenant_id', TEST_TENANT_ID);
  await db.from('tenants').delete().eq('id', TEST_TENANT_ID);
}
