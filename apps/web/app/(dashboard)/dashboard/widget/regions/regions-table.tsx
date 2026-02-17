'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MapPin } from 'lucide-react';

export interface GroupedRegion {
  name: string;
  slug: string;
  body_area: string;
  display_order: number;
  woman: boolean;
  man: boolean;
  womanId: string | null;
  manId: string | null;
}

const bodyAreaStyles: Record<string, string> = {
  face: 'bg-amber-100 text-amber-700',
  body: 'bg-teal-100 text-teal-700',
};

export function RegionsTable({ initialRegions }: { initialRegions: GroupedRegion[] }) {
  const [regions, setRegions] = useState(initialRegions);
  const supabase = createClient();

  async function toggleGender(slug: string, gender: 'woman' | 'man', checked: boolean) {
    setRegions((prev) =>
      prev.map((r) =>
        r.slug === slug ? { ...r, [gender]: checked } : r
      )
    );

    const region = regions.find((r) => r.slug === slug);
    if (!region) return;

    const id = gender === 'woman' ? region.womanId : region.manId;
    if (!id) return;

    await supabase
      .from('body_regions')
      .update({ is_active: checked })
      .eq('id', id);
  }

  if (regions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          No regions found
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Body Area</TableHead>
          <TableHead className="text-center">Woman</TableHead>
          <TableHead className="text-center">Man</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {regions.map((region) => {
          const disabled = !region.woman && !region.man;
          return (
            <TableRow
              key={region.slug}
              className={disabled ? 'opacity-40' : ''}
            >
              <TableCell className="font-medium">{region.name}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={bodyAreaStyles[region.body_area] ?? ''}
                >
                  {region.body_area}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {region.womanId ? (
                  <Switch
                    checked={region.woman}
                    onCheckedChange={(checked) =>
                      toggleGender(region.slug, 'woman', checked)
                    }
                    className="mx-auto data-[state=checked]:bg-pink-500"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                {region.manId ? (
                  <Switch
                    checked={region.man}
                    onCheckedChange={(checked) =>
                      toggleGender(region.slug, 'man', checked)
                    }
                    className="mx-auto data-[state=checked]:bg-blue-500"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
