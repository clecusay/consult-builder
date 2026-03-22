import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { WidgetConfigResponse, WidgetRegion, WidgetConcern } from '@treatment-builder/shared';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');
  const locationId = searchParams.get('location');

  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenant_id parameter' }, { status: 400 });
  }

  if (!UUID_RE.test(tenantId)) {
    return NextResponse.json({ error: 'Invalid tenant_id format' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Fetch tenant by ID
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, status')
    .eq('id', tenantId)
    .eq('status', 'active')
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Fetch widget config
  const { data: config } = await supabase
    .from('widget_configs')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single();

  if (!config) {
    return NextResponse.json({ error: 'Widget not configured' }, { status: 404 });
  }

  // Validate location belongs to this tenant when provided
  if (locationId) {
    if (!UUID_RE.test(locationId)) {
      return NextResponse.json({ error: 'Invalid location format' }, { status: 400 });
    }
    const { data: location } = await supabase
      .from('tenant_locations')
      .select('id')
      .eq('id', locationId)
      .eq('tenant_id', tenant.id)
      .single();
    if (!location) {
      return NextResponse.json({ error: 'Location not found for this tenant' }, { status: 404 });
    }
  }

  const widgetMode: string = config.widget_mode || 'regions_concerns';
  const modeIncludesServices = widgetMode.includes('services');
  const modeIncludesConcerns = widgetMode.includes('concerns');

  // Fetch body regions: tenant-specific first, then platform defaults
  // Tenant overrides have the same slug, so we prefer tenant-specific rows.
  // We must fetch ALL tenant overrides (including inactive) so disabled
  // overrides properly shadow the platform defaults.
  const { data: allTenantRegions } = await supabase
    .from('body_regions')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('display_order');

  const { data: defaultRegions } = await supabase
    .from('body_regions')
    .select('*')
    .is('tenant_id', null)
    .eq('is_active', true)
    .order('display_order');

  // Merge: tenant overrides replace defaults with the same slug+gender.
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

  // Build a mapping from slug+gender → platform default ID so that tenant
  // clones can inherit the default's relationships (concerns, service links).
  const defaultIdBySlugGender = new Map<string, string>();
  for (const r of defaultRegions || []) {
    defaultIdBySlugGender.set(`${(r as { slug: string }).slug}:${(r as { gender: string }).gender}`, (r as { id: string }).id);
  }
  const getEffectiveId = (r: { id: string; slug: string; gender: string; tenant_id: string | null }) =>
    r.tenant_id ? (defaultIdBySlugGender.get(`${r.slug}:${r.gender}`) ?? r.id) : r.id;

  // Fetch concerns using effective IDs (platform default IDs) so tenant
  // clones inherit the platform default's concerns.
  const effectiveIds = mergedRegions.map((r: { id: string; slug: string; gender: string; tenant_id: string | null }) => getEffectiveId(r));
  const regionIds = [...new Set([...mergedRegions.map((r: { id: string }) => r.id), ...effectiveIds])];
  const { data: allConcerns } = await supabase
    .from('concerns')
    .select('*')
    .in('body_region_id', regionIds)
    .eq('is_active', true)
    .order('display_order');

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

  // Fetch form fields
  const { data: formFields } = await supabase
    .from('form_fields')
    .select('id, field_key, field_type, label, placeholder, options, is_required, display_order')
    .eq('tenant_id', tenant.id)
    .order('display_order');

  // Fallback defaults if tenant has no form fields configured yet
  const DEFAULT_FORM_FIELDS = [
    { id: 'default-first-name', field_key: 'first_name', field_type: 'text', label: 'First Name', placeholder: 'Jane', options: null, is_required: true, display_order: 0 },
    { id: 'default-last-name', field_key: 'last_name', field_type: 'text', label: 'Last Name', placeholder: 'Doe', options: null, is_required: true, display_order: 1 },
    { id: 'default-email', field_key: 'email', field_type: 'email', label: 'Email', placeholder: 'jane@example.com', options: null, is_required: true, display_order: 2 },
    { id: 'default-phone', field_key: 'phone', field_type: 'phone', label: 'Phone', placeholder: '(555) 555-5555', options: null, is_required: false, display_order: 3 },
    { id: 'default-sms-opt-in', field_key: 'sms_opt_in', field_type: 'checkbox', label: 'SMS Opt-In', placeholder: 'I agree to receive SMS text messages with appointment reminders, promotions, and special offers. Message & data rates may apply. Reply STOP to unsubscribe.', options: null, is_required: false, display_order: 100 },
    { id: 'default-email-opt-in', field_key: 'email_opt_in', field_type: 'checkbox', label: 'Email Opt-In', placeholder: 'I would like to receive email updates including exclusive promotions, new treatment announcements, and helpful skincare tips. Unsubscribe anytime.', options: null, is_required: false, display_order: 101 },
  ];

  // Fetch services + categories for widget
  let allTenantServices: { id: string; name: string; slug: string; description: string | null; category_id: string | null }[] = [];
  const { data: tenantServices } = await supabase
    .from('services')
    .select('id, name, slug, description, category_id, is_active')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order');
  allTenantServices = tenantServices || [];

  // If a location is specified, filter out services that are disabled at that location
  if (locationId && allTenantServices.length > 0) {
    const { data: disabledLinks } = await supabase
      .from('location_disabled_services')
      .select('service_id')
      .eq('location_id', locationId);

    if (disabledLinks && disabledLinks.length > 0) {
      const disabledIds = new Set(disabledLinks.map((l: { service_id: string }) => l.service_id));
      allTenantServices = allTenantServices.filter(s => !disabledIds.has(s.id));
    }
  }

  const serviceIds = allTenantServices.map(s => s.id);

  const { data: serviceRegionLinks } = serviceIds.length > 0
    ? await supabase
        .from('service_body_regions')
        .select('service_id, body_region_id')
        .in('service_id', serviceIds)
    : { data: [] };

  const { data: concernServiceLinks } = serviceIds.length > 0
    ? await supabase
        .from('concern_services')
        .select('concern_id, service_id')
        .in('service_id', serviceIds)
    : { data: [] };

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
  // Collect region IDs that have services linked to them
  const regionIdsWithServices = new Set<string>();
  for (const links of serviceRegionMap.values()) {
    for (const regionId of links) {
      regionIdsWithServices.add(regionId);
    }
  }

  // Collect region IDs that have concerns configured
  const regionIdsWithConcerns = new Set<string>(concernsByRegion.keys());

  // The tenant has explicitly configured service → body-region mappings.
  // This is the strongest signal of what they offer, so use it as the
  // primary scope for which body parts appear on the diagram.
  const hasServiceRegionLinks = regionIdsWithServices.size > 0;

  // Determine which regions to keep:
  // Priority 1: If the tenant has service-body-region links, use them as the
  //   authoritative list of offered regions. This prevents a face-only clinic
  //   from showing abdomen, legs, etc. even though platform-default concerns
  //   exist for those body parts.
  // Priority 2: If no service-region links exist but tenant has services, show
  //   all regions (services haven't been mapped to regions yet).
  // Priority 3: If no services at all (fresh tenant), show all regions as a
  //   fallback so the widget isn't empty.
  // Helper: check if a region (or its platform default equivalent) has services
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
    : mergedRegions; // no service-region links: show everything

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
    concerns: concernsByRegion.get(r.id as string)
      || concernsByRegion.get(getEffectiveId(r as { id: string; slug: string; gender: string; tenant_id: string | null }))
      || [],
  }));

  // Fetch service categories
  const categoryIds = [...new Set(allTenantServices.map(s => s.category_id).filter(Boolean))];
  const { data: categories } = categoryIds.length > 0
    ? await supabase
        .from('service_categories')
        .select('id, name, slug')
        .in('id', categoryIds)
    : { data: [] };

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

  // Add uncategorized services
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
      redirect_url: config.redirect_url,
      custom_css: config.custom_css,
    },
    widget_mode: config.widget_mode || 'regions_concerns',
    diagram_type: config.diagram_type || 'full_body',
    regions,
    service_categories: serviceCategories,
    form_fields: (formFields && formFields.length > 0) ? formFields : DEFAULT_FORM_FIELDS,
  };

  // Cache for 60 seconds
  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
