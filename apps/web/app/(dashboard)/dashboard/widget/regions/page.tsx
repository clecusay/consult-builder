import { requireSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConcernsPanel, type ConcernGroup } from './concerns-panel';

interface ConcernRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  tenant_id: string | null;
  body_regions: {
    id: string;
    name: string;
    gender: string;
    body_area: string;
    is_active: boolean;
  } | null;
}

function groupConcerns(concerns: ConcernRow[]): { groups: ConcernGroup[]; total: number; active: number } {
  const map = new Map<string, ConcernGroup>();

  for (const concern of concerns) {
    const regionId = concern.body_regions?.id ?? 'unknown';
    const regionName = concern.body_regions?.name ?? 'Unknown Region';
    const regionGender = concern.body_regions?.gender ?? 'all';
    const regionArea = concern.body_regions?.body_area ?? 'body';
    const regionIsActive = concern.body_regions?.is_active ?? true;

    if (!map.has(regionId)) {
      map.set(regionId, {
        regionId,
        regionName,
        regionGender,
        regionArea,
        regionIsActive,
        concerns: [],
      });
    }
    map.get(regionId)!.concerns.push({
      id: concern.id,
      name: concern.name,
      slug: concern.slug,
      is_active: concern.is_active,
      tenant_id: concern.tenant_id,
    });
  }

  return {
    groups: Array.from(map.values()),
    total: concerns.length,
    active: concerns.filter((c) => c.is_active).length,
  };
}

export default async function RegionsPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: concerns } = await supabase
    .from('concerns')
    .select(
      `
      id,
      name,
      slug,
      is_active,
      tenant_id,
      body_regions (
        id,
        name,
        gender,
        body_area,
        is_active
      )
    `
    )
    .or(`tenant_id.eq.${session.profile.tenant_id},tenant_id.is.null`)
    .order('display_order', { ascending: true });

  const { groups: concernGroups, total: totalConcerns, active: activeConcerns } = groupConcerns(
    (concerns ?? []) as unknown as ConcernRow[]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regions</h1>
        <p className="text-muted-foreground">
          Manage body regions and concerns for your widget
        </p>
      </div>

      <ConcernsPanel
        groups={concernGroups}
        totalConcerns={totalConcerns}
        activeConcerns={activeConcerns}
      />
    </div>
  );
}
