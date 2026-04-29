import type { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceWithCategory {
  id: string;
  name: string;
  category_name: string | null;
}

/**
 * Fetch active services with category names for a tenant.
 */
export async function getActiveServices(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ServiceWithCategory[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, category_id, service_categories(name)')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to load services: ${error.message}`);

  return (data ?? []).map((s) => {
    const cat = s.service_categories as unknown as { name: string } | null;
    return {
      id: s.id,
      name: s.name,
      category_name: cat?.name ?? null,
    };
  });
}
