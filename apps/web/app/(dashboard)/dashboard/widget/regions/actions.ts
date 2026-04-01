'use server';

import { requireSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Toggle body region(s) is_active.
 * Platform-default regions (tenant_id IS NULL) cannot be mutated directly —
 * we create a tenant-specific clone with the desired is_active value so the
 * API's merge logic picks the tenant copy over the platform default.
 */
export async function toggleBodyRegions(regionIds: string[], isActive: boolean) {
  const session = await requireSession();
  const tenantId = session.profile.tenant_id;
  const supabase = await createServerSupabaseClient();

  // Fetch the regions we need to toggle
  const { data: regions, error: fetchErr } = await supabase
    .from('body_regions')
    .select('*')
    .in('id', regionIds);

  if (fetchErr || !regions) {
    return { error: fetchErr?.message ?? 'Failed to fetch regions' };
  }

  const tenantOwned = regions.filter((r) => r.tenant_id === tenantId);
  const platformDefaults = regions.filter((r) => r.tenant_id === null);

  // Update tenant-owned regions directly
  if (tenantOwned.length > 0) {
    const { error } = await supabase
      .from('body_regions')
      .update({ is_active: isActive })
      .in(
        'id',
        tenantOwned.map((r) => r.id)
      );
    if (error) return { error: error.message };
  }

  // Clone platform defaults as tenant-specific overrides
  if (platformDefaults.length > 0) {
    // Check if tenant already has overrides for these slug+gender combos
    const { data: existing } = await supabase
      .from('body_regions')
      .select('id, slug, gender')
      .eq('tenant_id', tenantId);

    const existingMap = new Map(
      (existing || []).map((r) => [`${r.slug}:${r.gender}`, r.id])
    );

    const toInsert: typeof platformDefaults = [];
    const toUpdateIds: string[] = [];

    for (const r of platformDefaults) {
      const key = `${r.slug}:${r.gender}`;
      const existingId = existingMap.get(key);
      if (existingId) {
        toUpdateIds.push(existingId);
      } else {
        toInsert.push(r);
      }
    }

    // Update existing tenant overrides
    if (toUpdateIds.length > 0) {
      const { error } = await supabase
        .from('body_regions')
        .update({ is_active: isActive })
        .in('id', toUpdateIds);
      if (error) return { error: error.message };
    }

    // Insert new tenant clones
    if (toInsert.length > 0) {
      const clones = toInsert.map((r) => ({
        tenant_id: tenantId,
        name: r.name,
        slug: r.slug,
        body_area: r.body_area,
        gender: r.gender,
        display_order: r.display_order,
        hotspot_x: r.hotspot_x,
        hotspot_y: r.hotspot_y,
        diagram_view: r.diagram_view,
        card_description: r.card_description,
        display_group: r.display_group,
        is_active: isActive,
      }));

      const { error } = await supabase.from('body_regions').insert(clones);
      if (error) return { error: error.message };
    }
  }

  return { error: null };
}

/**
 * Batch-save all region and concern changes at once.
 * Called by the "Save Changes" button instead of auto-saving each toggle.
 */
export async function saveRegionChanges(
  regionChanges: { regionId: string; isActive: boolean }[],
  concernChanges: { ids: string[]; isActive: boolean }[],
) {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  // Group region changes by target state
  const regionsToEnable = regionChanges.filter((r) => r.isActive).map((r) => r.regionId);
  const regionsToDisable = regionChanges.filter((r) => !r.isActive).map((r) => r.regionId);

  if (regionsToEnable.length > 0) {
    const { error } = await toggleBodyRegions(regionsToEnable, true);
    if (error) return { error };
  }
  if (regionsToDisable.length > 0) {
    const { error } = await toggleBodyRegions(regionsToDisable, false);
    if (error) return { error };
  }

  // Apply concern changes
  for (const change of concernChanges) {
    if (change.ids.length === 0) continue;
    const { error } = await supabase
      .from('concerns')
      .update({ is_active: change.isActive })
      .in('id', change.ids);
    if (error) return { error: error.message };
  }

  return { error: null };
}
