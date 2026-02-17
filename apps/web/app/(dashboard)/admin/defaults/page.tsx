import { requireRole } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Shield, MapPin, Sparkles } from 'lucide-react';

const genderStyles: Record<string, string> = {
  female: 'bg-pink-100 text-pink-700',
  male: 'bg-blue-100 text-blue-700',
  all: 'bg-gray-100 text-gray-700',
};

const bodyAreaStyles: Record<string, string> = {
  face: 'bg-amber-100 text-amber-700',
  body: 'bg-teal-100 text-teal-700',
};

export default async function PlatformDefaultsPage() {
  await requireRole(['platform_admin']);
  const supabase = await createServerSupabaseClient();

  const [
    { data: defaultRegions, count: regionCount },
    { count: concernCount },
  ] = await Promise.all([
    supabase
      .from('body_regions')
      .select('id, name, slug, gender, body_area, display_order, is_active', {
        count: 'exact',
      })
      .is('tenant_id', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('concerns')
      .select('*', { count: 'exact', head: true })
      .is('tenant_id', null),
  ]);

  const regions = defaultRegions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Platform Defaults
          </h1>
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Platform Admin
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage default regions and concerns available to all tenants
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Default Regions
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regionCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              body regions available by default
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Default Concerns
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{concernCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              concerns available by default
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Default Regions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Default Body Regions</CardTitle>
          <CardDescription>
            These regions are available to all tenants unless overridden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Body Area</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">
                      {region.name}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {region.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={genderStyles[region.gender] ?? ''}
                      >
                        {region.gender}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={bodyAreaStyles[region.body_area] ?? ''}
                      >
                        {region.body_area}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {region.display_order}
                    </TableCell>
                    <TableCell>
                      {region.is_active ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-500"
                        >
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <MapPin className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No default regions configured
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                Add default body regions that will be available to all tenants
                on the platform.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
