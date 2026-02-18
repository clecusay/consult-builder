'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Sparkles, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ConcernItem {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  tenant_id: string | null;
}

export interface ConcernGroup {
  regionId: string;
  regionName: string;
  regionGender: string;
  regionArea: string;
  regionIsActive: boolean;
  concerns: ConcernItem[];
}

interface Props {
  groups: ConcernGroup[];
  totalConcerns: number;
  activeConcerns: number;
}

interface RegionVariant {
  regionId: string;
  gender: string;
  isActive: boolean;
  concerns: ConcernItem[];
}

interface MergedRegion {
  key: string;
  regionName: string;
  regionArea: string;
  variants: RegionVariant[];
}

const areaStyle: Record<string, string> = {
  face: 'bg-amber-100 text-amber-700',
  body: 'bg-teal-100 text-teal-700',
};

function mergeGroups(groups: ConcernGroup[]): MergedRegion[] {
  const map = new Map<string, MergedRegion>();

  for (const g of groups) {
    const key = `${g.regionName}-${g.regionArea}`;
    if (!map.has(key)) {
      map.set(key, { key, regionName: g.regionName, regionArea: g.regionArea, variants: [] });
    }
    map.get(key)!.variants.push({
      regionId: g.regionId,
      gender: g.regionGender,
      isActive: g.regionIsActive,
      concerns: g.concerns,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.regionName.localeCompare(b.regionName)
  );
}

export function ConcernsPanel({ groups, totalConcerns, activeConcerns }: Props) {
  const [concernGroups, setConcernGroups] = useState(groups);
  const [activeCount, setActiveCount] = useState(activeConcerns);
  const supabase = createClient();

  const merged = useMemo(() => mergeGroups(concernGroups), [concernGroups]);
  const [selectedKey, setSelectedKey] = useState<string | null>(merged[0]?.key ?? null);
  const selectedRegion = merged.find((m) => m.key === selectedKey) ?? null;

  async function toggleRegion(region: MergedRegion, checked: boolean) {
    const ids = region.variants.map((v) => v.regionId);
    // Optimistic
    setConcernGroups((prev) =>
      prev.map((g) =>
        ids.includes(g.regionId) ? { ...g, regionIsActive: checked } : g
      )
    );

    const { error } = await supabase
      .from('body_regions')
      .update({ is_active: checked })
      .in('id', ids);

    if (error) {
      setConcernGroups((prev) =>
        prev.map((g) =>
          ids.includes(g.regionId) ? { ...g, regionIsActive: !checked } : g
        )
      );
      toast.error('Failed to update region');
    }
  }

  async function toggleGenderVariant(regionId: string, checked: boolean) {
    // Optimistic
    setConcernGroups((prev) =>
      prev.map((g) =>
        g.regionId === regionId ? { ...g, regionIsActive: checked } : g
      )
    );

    const { error } = await supabase
      .from('body_regions')
      .update({ is_active: checked })
      .eq('id', regionId);

    if (error) {
      setConcernGroups((prev) =>
        prev.map((g) =>
          g.regionId === regionId ? { ...g, regionIsActive: !checked } : g
        )
      );
      toast.error('Failed to update gender');
    }
  }

  async function toggleConcern(ids: string[], checked: boolean) {
    setConcernGroups((prev) =>
      prev.map((group) => ({
        ...group,
        concerns: group.concerns.map((c) =>
          ids.includes(c.id) ? { ...c, is_active: checked } : c
        ),
      }))
    );
    setActiveCount((prev) => prev + (checked ? ids.length : -ids.length));

    const { error } = await supabase
      .from('concerns')
      .update({ is_active: checked })
      .in('id', ids);

    if (error) {
      setConcernGroups((prev) =>
        prev.map((group) => ({
          ...group,
          concerns: group.concerns.map((c) =>
            ids.includes(c.id) ? { ...c, is_active: !checked } : c
          ),
        }))
      );
      setActiveCount((prev) => prev + (checked ? -ids.length : ids.length));
      toast.error('Failed to update concern');
    }
  }

  if (merged.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConcerns}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Body Regions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{merged.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid grid-cols-[280px_1fr] gap-4">
        {/* Region List (Master) */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Body Regions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="space-y-0.5 px-2">
              {merged.map((region) => {
                const selected = region.key === selectedKey;
                const anyActive = region.variants.some((v) => v.isActive);
                return (
                  <button
                    key={region.key}
                    onClick={() => setSelectedKey(region.key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                      selected
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">{region.regionName}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          areaStyle[region.regionArea] ?? 'bg-teal-100 text-teal-700'
                        )}
                      >
                        {region.regionArea}
                      </Badge>
                    </div>
                    <Switch
                      checked={anyActive}
                      onCheckedChange={(checked) => {
                        toggleRegion(region, checked);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="scale-75 shrink-0"
                    />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Concern Detail (Detail) */}
        {selectedRegion ? (
          <Card className="relative overflow-hidden">
            {!selectedRegion.variants.some((v) => v.isActive) && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
                <div className="text-center">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">Region is inactive</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Enable this region to manage its concerns
                  </p>
                </div>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedRegion.regionName}</CardTitle>
                  <CardDescription>
                    {new Set(selectedRegion.variants.flatMap((v) => v.concerns.map((c) => c.slug))).size} concern
                    {new Set(selectedRegion.variants.flatMap((v) => v.concerns.map((c) => c.slug))).size !== 1 ? 's' : ''}
                    {' \u00b7 '}
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-1.5 py-0 ml-1',
                        areaStyle[selectedRegion.regionArea] ?? 'bg-teal-100 text-teal-700'
                      )}
                    >
                      {selectedRegion.regionArea}
                    </Badge>
                  </CardDescription>
                </div>
                {/* Gender toggles */}
                <div className="flex items-center gap-5">
                  {selectedRegion.variants.map((v) => (
                    <div key={v.regionId} className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {v.gender === 'female'
                          ? 'Woman'
                          : v.gender === 'male'
                            ? 'Man'
                            : 'All'}
                      </span>
                      <Switch
                        checked={v.isActive}
                        onCheckedChange={(checked) =>
                          toggleGenderVariant(v.regionId, checked)
                        }
                        className={cn(
                          'data-[state=checked]:bg-pink-500',
                          v.gender === 'male' && 'data-[state=checked]:bg-blue-500'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="space-y-2">
                {(() => {
                  // Deduplicate concerns by slug across gender variants
                  const seen = new Map<string, { ids: string[]; name: string; slug: string; is_active: boolean; tenant_id: string | null }>();
                  for (const v of selectedRegion.variants) {
                    for (const c of v.concerns) {
                      const existing = seen.get(c.slug);
                      if (existing) {
                        existing.ids.push(c.id);
                        // Active if any variant is active
                        if (c.is_active) existing.is_active = true;
                      } else {
                        seen.set(c.slug, {
                          ids: [c.id],
                          name: c.name,
                          slug: c.slug,
                          is_active: c.is_active,
                          tenant_id: c.tenant_id,
                        });
                      }
                    }
                  }
                  return Array.from(seen.values()).map((concern) => (
                    <div
                      key={concern.slug}
                      className="flex items-center justify-between rounded-md border px-4 py-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{concern.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
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
                        <Switch
                          checked={concern.is_active}
                          disabled={concern.tenant_id === null}
                          onCheckedChange={(checked) => toggleConcern(concern.ids, checked)}
                          className={concern.tenant_id === null ? 'opacity-50' : ''}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <MapPin className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  Select a body region
                </h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                  Choose a region from the left to view and manage its concerns.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
