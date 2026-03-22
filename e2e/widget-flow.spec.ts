import { test, expect } from '@playwright/test';

// Uses the existing Sunrise Medical Center tenant in the local Supabase.
// Adjust the tenant ID if your local data differs.
const TENANT_ID = 'a1abe023-e09f-4466-8a16-305f60e119bb';

test.describe('Widget preview', () => {
  test('loads the widget preview page', async ({ page }) => {
    await page.goto(`/widget/preview?tenant_id=${TENANT_ID}`);

    // The page should render without errors
    await expect(page).toHaveTitle(/Treatment Builder|Consult/i);
  });

  test('widget config API returns JSON', async ({ request }) => {
    const res = await request.get(`/api/widget/config?tenant_id=${TENANT_ID}`);
    expect(res.ok()).toBeTruthy();

    const data = await res.json();
    expect(data.tenant.id).toBe(TENANT_ID);
    expect(data.regions).toBeDefined();
    expect(data.form_fields).toBeDefined();
  });

  test('widget submit API rejects empty payload', async ({ request }) => {
    const res = await request.post('/api/widget/submit', {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('widget submit API rejects empty required fields', async ({ request }) => {
    const res = await request.post('/api/widget/submit', {
      data: {
        tenant_id: TENANT_ID,
        first_name: '',
        last_name: '',
        email: '',
        gender: 'female',
        selected_regions: [],
        selected_concerns: [],
      },
    });
    expect(res.status()).toBe(400);

    const body = await res.json();
    expect(body.error).toBe('Invalid submission');
    expect(body.details).toBeDefined();
  });
});
