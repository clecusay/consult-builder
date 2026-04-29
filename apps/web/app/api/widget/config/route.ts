import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeCSS } from '@/lib/sanitize-css';
import { getCorsOrigin, corsHeaders, handleCorsOptions } from '@/lib/cors';
import type { WidgetConfigResponse, WidgetRegion, WidgetConcern, WidgetMode, SuccessFlowConfig } from '@treatment-builder/shared';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CACHE_ERROR = { 'Cache-Control': 'public, max-age=30' };

const REGION_COLS = 'id, tenant_id, name, slug, gender, body_area, display_order, hotspot_x, hotspot_y, diagram_view, is_active, card_description, display_group';
const CONCERN_COLS = 'id, body_region_id, name, slug, description, display_order';

/** Remove duplicate form fields — keeps the row with a field_key over one without. */
function deduplicateFormFields<T extends { field_key: string | null; label: string }>(fields: T[]): T[] {
  const seen = new Map<string, T>();
  for (const f of fields) {
    const key = f.field_key || f.label.toLowerCase();
    const existing = seen.get(key);
    if (!existing || (f.field_key && !existing.field_key)) {
      seen.set(key, f);
    }
  }
  return [...seen.values()];
}

const configLimiter = rateLimit({ limit: 60, windowMs: 60_000, keyPrefix: 'config' });

export async function GET(request: Request) {
  // Rate limit: 60 requests per minute per IP
  const rl = configLimiter(request);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const locationId = searchParams.get('location');
  const flowOverride = searchParams.get('flow');
  const layoutOverride = searchParams.get('layout');
  const regionStyleOverride = searchParams.get('region_style');

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant_id parameter' }, { status: 400, headers: CACHE_ERROR });
  }

  if (!UUID_RE.test(tenantId)) {
    return NextResponse.json({ error: 'Invalid tenant_id format' }, { status: 400, headers: CACHE_ERROR });
  }

  if (locationId && !UUID_RE.test(locationId)) {
    return NextResponse.json({ error: 'Invalid location format' }, { status: 400, headers: CACHE_ERROR });
  }

  const supabase = await createServiceRoleClient();

  // ── Batch 1: tenant + widget config (parallel) ──
  const [tenantResult, configResult] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, name, slug, logo_url, status')
      .eq('id', tenantId)
      .eq('status', 'active')
      .single(),
    supabase
      .from('widget_configs')
      .select('primary_color, secondary_color, accent_color, font_family, cta_text, success_message, success_heading, success_action_url, success_action_type, success_action_label, redirect_url, custom_css, widget_mode, diagram_type, region_style, widget_layout, success_flow_config, allowed_origins')
      .eq('tenant_id', tenantId)
      .single(),
  ]);

  const tenant = tenantResult.data;
  const config = configResult.data;

  if (tenantResult.error || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: CACHE_ERROR });
  }

  if (!config) {
    return NextResponse.json({ error: 'Widget not configured' }, { status: 404, headers: CACHE_ERROR });
  }

  const widgetMode = (flowOverride || config.widget_mode || 'regions_concerns') as WidgetMode;
  const modeIncludesServices = widgetMode.includes('services');
  const modeIncludesConcerns = widgetMode.includes('concerns');

  // ── Batch 2: all tenant data (parallel) ──
  // These queries are independent — they all filter by tenant.id or null.
  const batch2 = await Promise.all([
    // [0] tenant locations list
    supabase
      .from('tenant_locations')
      .select('id, name, is_primary, city, state')
      .eq('tenant_id', tenant.id)
      .order('is_primary', { ascending: false })
      .order('name'),
    // [1] tenant body region overrides (all, including inactive for shadowing)
    supabase
      .from('body_regions')
      .select(REGION_COLS)
      .eq('tenant_id', tenant.id)
      .order('display_order'),
    // [2] platform default body regions
    supabase
      .from('body_regions')
      .select(REGION_COLS)
      .is('tenant_id', null)
      .eq('is_active', true)
      .order('display_order'),
    // [3] form fields
    supabase
      .from('form_fields')
      .select('id, field_key, field_type, label, placeholder, options, is_required, display_order')
      .eq('tenant_id', tenant.id)
      .order('display_order'),
    // [4] tenant services
    supabase
      .from('services')
      .select('id, name, slug, description, category_id, is_active')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('display_order'),
    // [5] location validation (if locationId provided)
    locationId
      ? supabase
          .from('tenant_locations')
          .select('id')
          .eq('id', locationId)
          .eq('tenant_id', tenant.id)
          .single()
      : Promise.resolve({ data: { id: '' }, error: null }),
    // [6] disabled services at location (if locationId provided)
    locationId
      ? supabase
          .from('location_disabled_services')
          .select('service_id')
          .eq('location_id', locationId)
      : Promise.resolve({ data: [] as { service_id: string }[], error: null }),
  ]);

  const tenantLocations = batch2[0].data;
  const allTenantRegions = batch2[1].data;
  const defaultRegions = batch2[2].data;
  const formFields = batch2[3].data;
  const tenantServices = batch2[4].data;
  const locationValidation = batch2[5];
  const disabledLinksResult = batch2[6];

  // Validate location belongs to this tenant
  if (locationId && (locationValidation.error || !locationValidation.data)) {
    return NextResponse.json({ error: 'Location not found for this tenant' }, { status: 404, headers: CACHE_ERROR });
  }

  // ── Merge body regions ──
  // Tenant overrides replace defaults with the same slug+gender.
  // Use ALL tenant slugs (active + inactive) for shadowing, then only
  // include active regions in the final result.
  const tenantSlugs = new Set(
    (allTenantRegions || []).map((r: { slug: string; gender: string }) => `${r.slug}:${r.gender}`)
  );
  const activeTenantRegions = (allTenantRegions || []).filter(
    (r: { is_active: boolean }) => r.is_active
  );
  const mergedRegions = [
    ...activeTenantRegions,
    ...(defaultRegions || []).filter(
      (r: { slug: string; gender: string }) => !tenantSlugs.has(`${r.slug}:${r.gender}`)
    ),
  ].sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);

  // Build slug+gender → platform default ID mapping for concern/service inheritance
  const defaultIdBySlugGender = new Map<string, string>();
  for (const r of defaultRegions || []) {
    defaultIdBySlugGender.set(`${(r as { slug: string }).slug}:${(r as { gender: string }).gender}`, (r as { id: string }).id);
  }
  const getEffectiveId = (r: { id: string; slug: string; gender: string; tenant_id: string | null }) =>
    r.tenant_id ? (defaultIdBySlugGender.get(`${r.slug}:${r.gender}`) ?? r.id) : r.id;

  // Compute region IDs and service IDs for batch 3
  const effectiveIds = mergedRegions.map((r: { id: string; slug: string; gender: string; tenant_id: string | null }) => getEffectiveId(r));
  const regionIds = [...new Set([...mergedRegions.map((r: { id: string }) => r.id), ...effectiveIds])];

  // Filter services by location-disabled list
  let allTenantServices = tenantServices || [];
  if (locationId && disabledLinksResult.data && (disabledLinksResult.data as { service_id: string }[]).length > 0) {
    const disabledIds = new Set((disabledLinksResult.data as { service_id: string }[]).map(l => l.service_id));
    allTenantServices = allTenantServices.filter(s => !disabledIds.has(s.id));
  }

  const serviceIds = allTenantServices.map(s => s.id);
  const categoryIds = [...new Set(allTenantServices.map(s => s.category_id).filter(Boolean))];

  // ── Batch 3: dependent lookups (parallel) ──
  const [concernsResult, serviceRegionResult, concernServiceResult, categoriesResult] = await Promise.all([
    supabase
      .from('concerns')
      .select(CONCERN_COLS)
      .in('body_region_id', regionIds)
      .eq('is_active', true)
      .order('display_order'),
    serviceIds.length > 0
      ? supabase.from('service_body_regions').select('service_id, body_region_id').in('service_id', serviceIds)
      : Promise.resolve({ data: [] as { service_id: string; body_region_id: string }[] }),
    serviceIds.length > 0
      ? supabase.from('concern_services').select('concern_id, service_id').in('service_id', serviceIds)
      : Promise.resolve({ data: [] as { concern_id: string; service_id: string }[] }),
    categoryIds.length > 0
      ? supabase.from('service_categories').select('id, name, slug').in('id', categoryIds)
      : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
  ]);

  const allConcerns = concernsResult.data;
  const serviceRegionLinks = serviceRegionResult.data;
  const concernServiceLinks = concernServiceResult.data;
  const categories = categoriesResult.data;

  // Group concerns by region
  const concernsByRegion = new Map<string, WidgetConcern[]>();
  for (const c of allConcerns || []) {
    const list = concernsByRegion.get(c.body_region_id) || [];
    list.push({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      display_order: c.display_order,
    });
    concernsByRegion.set(c.body_region_id, list);
  }

  // Build region/concern maps for services
  const serviceRegionMap = new Map<string, string[]>();
  for (const link of serviceRegionLinks || []) {
    const list = serviceRegionMap.get(link.service_id) || [];
    list.push(link.body_region_id);
    serviceRegionMap.set(link.service_id, list);
  }

  const serviceConcernMap = new Map<string, string[]>();
  for (const link of concernServiceLinks || []) {
    const list = serviceConcernMap.get(link.service_id) || [];
    list.push(link.concern_id);
    serviceConcernMap.set(link.service_id, list);
  }

  // ── Filter regions to only those relevant to the tenant's offerings ──
  const regionIdsWithServices = new Set<string>();
  for (const links of serviceRegionMap.values()) {
    for (const regionId of links) {
      regionIdsWithServices.add(regionId);
    }
  }

  const regionIdsWithConcerns = new Set<string>(concernsByRegion.keys());
  const hasServiceRegionLinks = regionIdsWithServices.size > 0;

  const hasServices = (r: { id: string; slug: string; gender: string; tenant_id: string | null }) =>
    regionIdsWithServices.has(r.id) || regionIdsWithServices.has(getEffectiveId(r));
  const hasConcerns = (r: { id: string; slug: string; gender: string; tenant_id: string | null }) =>
    regionIdsWithConcerns.has(r.id) || regionIdsWithConcerns.has(getEffectiveId(r));

  const filteredRegions = hasServiceRegionLinks
    ? mergedRegions.filter((r: { id: string; slug: string; gender: string; tenant_id: string | null }) => {
        if (modeIncludesServices && modeIncludesConcerns) {
          return hasServices(r);
        }
        if (modeIncludesServices) {
          return hasServices(r);
        }
        if (modeIncludesConcerns) {
          return hasServices(r) && hasConcerns(r);
        }
        return true;
      })
    : mergedRegions;

  // Build regions response
  const regions: WidgetRegion[] = filteredRegions.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    gender: r.gender as 'female' | 'male' | 'all',
    body_area: r.body_area as 'face' | 'body',
    display_order: r.display_order as number,
    hotspot_x: r.hotspot_x as number | null,
    hotspot_y: r.hotspot_y as number | null,
    diagram_view: r.diagram_view as 'front' | 'back' | 'face' | null,
    card_description: r.card_description as string | null,
    display_group: r.display_group as 'face' | 'upper_body' | 'lower_body' | null,
    concerns: concernsByRegion.get(r.id as string)
      || concernsByRegion.get(getEffectiveId(r as { id: string; slug: string; gender: string; tenant_id: string | null }))
      || [],
  }));

  // Build service categories response
  const serviceCategories = (categories || []).map((cat: { id: string; name: string; slug: string }) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    services: allTenantServices
      .filter(s => s.category_id === cat.id)
      .map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        category_id: s.category_id,
        region_ids: serviceRegionMap.get(s.id) || [],
        concern_ids: serviceConcernMap.get(s.id) || [],
      })),
  }));

  const uncategorized = allTenantServices
    .filter(s => !s.category_id)
    .map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      category_id: null,
      region_ids: serviceRegionMap.get(s.id) || [],
      concern_ids: serviceConcernMap.get(s.id) || [],
    }));

  if (uncategorized.length > 0) {
    serviceCategories.push({
      id: 'uncategorized',
      name: 'Other',
      slug: 'other',
      services: uncategorized,
    });
  }

  // Fallback defaults if tenant has no form fields configured yet
  const DEFAULT_FORM_FIELDS = [
    { id: 'default-first-name', field_key: 'first_name', field_type: 'text', label: 'First Name', placeholder: 'Jane', options: null, is_required: true, display_order: 0 },
    { id: 'default-last-name', field_key: 'last_name', field_type: 'text', label: 'Last Name', placeholder: 'Doe', options: null, is_required: true, display_order: 1 },
    { id: 'default-email', field_key: 'email', field_type: 'email', label: 'Email', placeholder: 'jane@example.com', options: null, is_required: true, display_order: 2 },
    { id: 'default-phone', field_key: 'phone', field_type: 'phone', label: 'Phone', placeholder: '(555) 555-5555', options: null, is_required: false, display_order: 3 },
    { id: 'default-sms-opt-in', field_key: 'sms_opt_in', field_type: 'checkbox', label: 'SMS Opt-In', placeholder: 'I agree to receive SMS text messages with appointment reminders, promotions, and special offers. Message & data rates may apply. Reply STOP to unsubscribe.', options: null, is_required: false, display_order: 100 },
    { id: 'default-email-opt-in', field_key: 'email_opt_in', field_type: 'checkbox', label: 'Email Opt-In', placeholder: 'I would like to receive email updates including exclusive promotions, new treatment announcements, and helpful skincare tips. Unsubscribe anytime.', options: null, is_required: false, display_order: 101 },
  ];

  // ── Build success flow config (JSONB → old columns → defaults) ──
  const flowCfg = config.success_flow_config as Partial<SuccessFlowConfig> | null;
  const doctorName = flowCfg?.doctor_profile?.doctor_name || tenant.name;

  const successFlow: SuccessFlowConfig = {
    thank_you: {
      enabled: flowCfg?.thank_you?.enabled !== false,
      heading: flowCfg?.thank_you?.heading || config.success_heading || 'Thank You!',
      body: flowCfg?.thank_you?.body || config.success_message || "Now is the best time to schedule a consultation. Based upon your concerns, this is the perfect time for us to help you get more freedom. You're gonna feel much better this season. With your new look and outlook on life, we are going to make sure your best view is showing.",
    },
    doctor_profile: {
      enabled: flowCfg?.doctor_profile?.enabled !== false,
      heading: flowCfg?.doctor_profile?.heading || `Meet ${doctorName}`,
      body: flowCfg?.doctor_profile?.body || `${doctorName} is double board certified and a lineage of plastic surgeons who are well-renowned throughout the world. You're going to love the practice, the bedside manner, and the team members who are going to make sure that you are chaperoned through an ideal experience before your procedure, and you're going to become one of our family.`,
      doctor_name: doctorName,
    },
    calendar: {
      enabled: flowCfg?.calendar?.enabled !== false,
      heading: flowCfg?.calendar?.heading || 'Schedule Your Consultation',
      calendar_url: flowCfg?.calendar?.calendar_url || config.success_action_url || '',
      calendar_embed_type: flowCfg?.calendar?.calendar_embed_type || (config.success_action_type as 'iframe' | 'button') || 'button',
    },
  };

  const response: WidgetConfigResponse = {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logo_url: tenant.logo_url,
    },
    branding: {
      primary_color: config.primary_color,
      secondary_color: config.secondary_color,
      accent_color: config.accent_color,
      font_family: config.font_family,
      cta_text: config.cta_text,
      success_message: config.success_message,
      success_heading: config.success_heading || 'Thank You!',
      success_action_url: config.success_action_url || null,
      success_action_type: config.success_action_type || null,
      success_action_label: config.success_action_label || 'Schedule Now',
      redirect_url: config.redirect_url,
      custom_css: config.custom_css ? sanitizeCSS(config.custom_css) : null,
      success_flow: successFlow,
    },
    widget_mode: widgetMode,
    diagram_type: config.diagram_type || 'full_body',
    region_style: regionStyleOverride || config.region_style || 'diagram',
    widget_layout: layoutOverride || config.widget_layout || 'split',
    regions,
    service_categories: serviceCategories,
    form_fields: (formFields && formFields.length > 0) ? deduplicateFormFields(formFields) : DEFAULT_FORM_FIELDS,
    locations: (tenantLocations || []).map(loc => ({ id: loc.id, name: loc.name, is_primary: loc.is_primary, city: loc.city, state: loc.state })),
  };

  const origin = getCorsOrigin(request, config.allowed_origins as string[] | null);

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      ...corsHeaders(origin),
    },
  });
}

export async function OPTIONS(request: Request) {
  return handleCorsOptions(request, 'GET, OPTIONS');
}
