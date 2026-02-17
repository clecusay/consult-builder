import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { WidgetConfigResponse, WidgetRegion, WidgetConcern } from '@treatment-builder/shared';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Fetch tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, status')
    .eq('slug', slug)
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

  // Fetch body regions: tenant-specific first, then platform defaults
  // Tenant overrides have the same slug, so we prefer tenant-specific rows
  const { data: tenantRegions } = await supabase
    .from('body_regions')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order');

  const { data: defaultRegions } = await supabase
    .from('body_regions')
    .select('*')
    .is('tenant_id', null)
    .eq('is_active', true)
    .order('display_order');

  // Merge: tenant overrides replace defaults with the same slug+gender
  const tenantSlugs = new Set(
    (tenantRegions || []).map((r: { slug: string; gender: string }) => `${r.slug}:${r.gender}`)
  );
  const mergedRegions = [
    ...(tenantRegions || []),
    ...(defaultRegions || []).filter(
      (r: { slug: string; gender: string }) => !tenantSlugs.has(`${r.slug}:${r.gender}`)
    ),
  ].sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);

  // Fetch concerns for all relevant region IDs
  const regionIds = mergedRegions.map((r: { id: string }) => r.id);
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
    });
    concernsByRegion.set(c.body_region_id, list);
  }

  // Build regions response
  const regions: WidgetRegion[] = mergedRegions.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    gender: r.gender as 'female' | 'male' | 'all',
    body_area: r.body_area as 'face' | 'body',
    display_order: r.display_order as number,
    hotspot_x: r.hotspot_x as number | null,
    hotspot_y: r.hotspot_y as number | null,
    diagram_view: r.diagram_view as 'front' | 'back' | 'face' | null,
    concerns: concernsByRegion.get(r.id as string) || [],
  }));

  // Fetch form fields
  const { data: formFields } = await supabase
    .from('form_fields')
    .select('id, field_type, label, placeholder, options, is_required, display_order')
    .eq('tenant_id', tenant.id)
    .order('display_order');

  // Fetch services + categories for widget
  const { data: tenantServices } = await supabase
    .from('services')
    .select('id, name, slug, description, category_id, is_active')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order');

  const { data: serviceRegionLinks } = await supabase
    .from('service_body_regions')
    .select('service_id, body_region_id')
    .in('service_id', (tenantServices || []).map((s: { id: string }) => s.id));

  const { data: concernServiceLinks } = await supabase
    .from('concern_services')
    .select('concern_id, service_id')
    .in('service_id', (tenantServices || []).map((s: { id: string }) => s.id));

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

  // Fetch service categories
  const categoryIds = [...new Set((tenantServices || []).map((s: { category_id: string | null }) => s.category_id).filter(Boolean))];
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
    services: (tenantServices || [])
      .filter((s: { category_id: string | null }) => s.category_id === cat.id)
      .map((s: { id: string; name: string; slug: string; description: string | null; category_id: string | null }) => ({
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
  const uncategorized = (tenantServices || [])
    .filter((s: { category_id: string | null }) => !s.category_id)
    .map((s: { id: string; name: string; slug: string; description: string | null; category_id: string | null }) => ({
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
    form_fields: formFields || [],
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
