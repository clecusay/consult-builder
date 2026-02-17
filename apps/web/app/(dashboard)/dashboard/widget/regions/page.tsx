import { requireSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RegionsTable, type GroupedRegion } from './regions-table';

interface BodyRegionRow {
  id: string;
  tenant_id: string | null;
  name: string;
  slug: string;
  gender: string;
  body_area: string;
  display_order: number;
  is_active: boolean;
}

function groupRegions(regions: BodyRegionRow[]): GroupedRegion[] {
  const map = new Map<string, GroupedRegion>();

  for (const r of regions) {
    const key = `${r.slug}-${r.body_area}`;
    const existing = map.get(key);

    if (existing) {
      if (r.gender === 'female') {
        existing.woman = r.is_active;
        existing.womanId = r.id;
      }
      if (r.gender === 'male') {
        existing.man = r.is_active;
        existing.manId = r.id;
      }
      if (r.gender === 'all') {
        existing.woman = r.is_active;
        existing.man = r.is_active;
        existing.womanId = r.id;
        existing.manId = r.id;
      }
    } else {
      map.set(key, {
        name: r.name,
        slug: r.slug,
        body_area: r.body_area,
        display_order: r.display_order,
        woman: (r.gender === 'female' || r.gender === 'all') && r.is_active,
        man: (r.gender === 'male' || r.gender === 'all') && r.is_active,
        womanId: r.gender === 'female' || r.gender === 'all' ? r.id : null,
        manId: r.gender === 'male' || r.gender === 'all' ? r.id : null,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.display_order - b.display_order);
}

export default async function BodyRegionsPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: regions } = await supabase
    .from('body_regions')
    .select('id, tenant_id, name, slug, gender, body_area, display_order, is_active')
    .or(`tenant_id.eq.${session.profile.tenant_id},tenant_id.is.null`)
    .order('display_order', { ascending: true });

  const allRegions = (regions ?? []) as BodyRegionRow[];
  const grouped = groupRegions(allRegions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Body Regions</h1>
        <p className="text-muted-foreground">
          Manage the body areas available in your widget
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regions</CardTitle>
          <CardDescription>
            {grouped.length} unique region{grouped.length !== 1 ? 's' : ''} configured.
            Toggle Woman / Man to control which genders see each region.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegionsTable initialRegions={grouped} />
        </CardContent>
      </Card>
    </div>
  );
}
