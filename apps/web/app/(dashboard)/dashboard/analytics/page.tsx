import { requireSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp, MapPin, Sparkles } from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();
  const tenantId = session.profile.tenant_id;

  // This month's submissions
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ count: thisMonthCount }, { data: allSubmissions }] =
    await Promise.all([
      supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('form_submissions')
        .select('selected_regions, selected_concerns, created_at')
        .eq('tenant_id', tenantId),
    ]);

  // Calculate top region and top concern from submissions
  const regionCounts = new Map<string, number>();
  const concernCounts = new Map<string, number>();

  for (const sub of allSubmissions ?? []) {
    const regions = sub.selected_regions as Array<{
      region_name?: string;
    }> | null;
    const concerns = sub.selected_concerns as Array<{
      concern_name?: string;
    }> | null;

    if (Array.isArray(regions)) {
      for (const r of regions) {
        if (r.region_name) {
          regionCounts.set(
            r.region_name,
            (regionCounts.get(r.region_name) ?? 0) + 1
          );
        }
      }
    }
    if (Array.isArray(concerns)) {
      for (const c of concerns) {
        if (c.concern_name) {
          concernCounts.set(
            c.concern_name,
            (concernCounts.get(c.concern_name) ?? 0) + 1
          );
        }
      }
    }
  }

  const sortedRegions = Array.from(regionCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const sortedConcerns = Array.from(concernCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  const topRegion = sortedRegions[0]?.[0] ?? 'N/A';
  const topConcern = sortedConcerns[0]?.[0] ?? 'N/A';

  // Monthly submission counts for the chart placeholder (last 6 months)
  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const count = (allSubmissions ?? []).filter((s) => {
      const created = new Date(s.created_at);
      return created >= monthStart && created <= monthEnd;
    }).length;

    monthlyData.push({
      month: monthStart.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      count,
    });
  }

  const maxMonthCount = Math.max(...monthlyData.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track submission trends and popular concerns
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              submissions this month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Region
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{topRegion}</div>
            <p className="text-xs text-muted-foreground">
              most selected body area
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Concern
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{topConcern}</div>
            <p className="text-xs text-muted-foreground">
              most popular concern
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Submissions Over Time
          </CardTitle>
          <CardDescription>Last 6 months of submission activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-end gap-3">
            {monthlyData.map((month) => (
              <div
                key={month.month}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-xs font-medium">{month.count}</span>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all"
                  style={{
                    height: `${Math.max((month.count / maxMonthCount) * 140, 4)}px`,
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {month.month}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Concerns Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Top Concerns</CardTitle>
          <CardDescription>
            Most frequently selected concerns across all submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedConcerns.length > 0 ? (
            <div className="space-y-3">
              {sortedConcerns.slice(0, 10).map(([name, count]) => {
                const percentage = Math.round(
                  (count / (allSubmissions?.length || 1)) * 100
                );
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{name}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary/70 transition-all"
                        style={{
                          width: `${(count / sortedConcerns[0][1]) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No data yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Analytics will populate as submissions come in.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
