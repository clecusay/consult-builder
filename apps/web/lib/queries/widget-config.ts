import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch widget config columns for a tenant.
 * Returns the data or throws on error.
 */
export async function getWidgetConfig<T extends string>(
  supabase: SupabaseClient,
  tenantId: string,
  columns: T,
) {
  const { data, error } = await supabase
    .from('widget_configs')
    .select(columns)
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw new Error(`Failed to load widget config: ${error.message}`);
  return data;
}

/**
 * Update widget config for a tenant.
 * Throws on error.
 */
export async function updateWidgetConfig(
  supabase: SupabaseClient,
  tenantId: string,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('widget_configs')
    .update(updates)
    .eq('tenant_id', tenantId);

  if (error) throw new Error(error.message);
}
