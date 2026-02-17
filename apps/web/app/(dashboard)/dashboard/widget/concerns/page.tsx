import { requireSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, ChevronDown } from 'lucide-react';

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
  } | null;
}

export default async function ConcernsPage() {
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
        body_area
      )
    `
    )
    .or(`tenant_id.eq.${session.profile.tenant_id},tenant_id.is.null`)
    .order('display_order', { ascending: true });

  const allConcerns = (concerns ?? []) as unknown as ConcernRow[];

  // Group by body region
  const grouped = new Map<
    string,
    { regionName: string; regionGender: string; regionArea: string; concerns: ConcernRow[] }
  >();

  for (const concern of allConcerns) {
    const regionId = concern.body_regions?.id ?? 'unknown';
    const regionName = concern.body_regions?.name ?? 'Unknown Region';
    const regionGender = concern.body_regions?.gender ?? 'all';
    const regionArea = concern.body_regions?.body_area ?? 'body';

    if (!grouped.has(regionId)) {
      grouped.set(regionId, {
        regionName,
        regionGender,
        regionArea,
        concerns: [],
      });
    }
    grouped.get(regionId)!.concerns.push(concern);
  }

  const groupedEntries = Array.from(grouped.entries());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Concerns</h1>
        <p className="text-muted-foreground">
          Manage aesthetic concerns for each body region
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allConcerns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Body Regions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupedEntries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Active Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allConcerns.filter((c) => c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped Sections */}
      {groupedEntries.length > 0 ? (
        <div className="space-y-4">
          {groupedEntries.map(
            ([regionId, { regionName, regionGender, regionArea, concerns: regionConcerns }]) => (
              <Card key={regionId}>
                <details open>
                  <summary className="cursor-pointer list-none">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                          <div>
                            <CardTitle className="text-base">
                              {regionName}
                            </CardTitle>
                            <CardDescription>
                              {regionConcerns.length} concern
                              {regionConcerns.length !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant="secondary"
                            className={
                              regionGender === 'female'
                                ? 'bg-pink-100 text-pink-700'
                                : regionGender === 'male'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }
                          >
                            {regionGender}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={
                              regionArea === 'face'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-teal-100 text-teal-700'
                            }
                          >
                            {regionArea}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </summary>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      {regionConcerns.map((concern) => (
                        <div
                          key={concern.id}
                          className="flex items-center justify-between rounded-md border px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {concern.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {concern.tenant_id === null ? (
                              <Badge variant="outline" className="text-xs">
                                Default
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-violet-100 text-violet-700 text-xs"
                              >
                                Custom
                              </Badge>
                            )}
                            {concern.is_active ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700 text-xs"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-100 text-gray-500 text-xs"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </details>
              </Card>
            )
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No concerns configured
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                Concerns will be populated from the platform defaults or can be
                added manually for your tenant.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
