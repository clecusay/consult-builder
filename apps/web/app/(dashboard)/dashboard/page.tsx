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
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Inbox,
  TrendingUp,
  MapPin,
  BarChart3,
  Palette,
  FileText,
  Code2,
} from 'lucide-react';
import Link from 'next/link';

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
};

export default async function DashboardPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();
  const tenantId = session.profile.tenant_id;

  // Fetch stats in parallel
  const [
    { count: totalSubmissions },
    { count: newLeads },
    { count: activeRegions },
    { data: recentSubmissions },
  ] = await Promise.all([
    supabase
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),
    supabase
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('lead_status', 'new'),
    supabase
      .from('body_regions')
      .select('*', { count: 'exact', head: true })
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .eq('is_active', true),
    supabase
      .from('form_submissions')
      .select('id, first_name, last_name, email, lead_status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const total = totalSubmissions ?? 0;

  // Calculate a rough conversion rate
  const { count: convertedCount } = await supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('lead_status', 'converted');

  const conversionRate =
    total > 0 ? Math.round(((convertedCount ?? 0) / total) * 100) : 0;

  const stats = [
    {
      title: 'Total Submissions',
      value: total,
      icon: Inbox,
      description: 'All time leads captured',
    },
    {
      title: 'New Leads',
      value: newLeads ?? 0,
      icon: TrendingUp,
      description: 'Awaiting first contact',
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      icon: BarChart3,
      description: `${convertedCount ?? 0} converted of ${total}`,
    },
    {
      title: 'Active Regions',
      value: activeRegions ?? 0,
      icon: MapPin,
      description: 'Body regions enabled',
    },
  ];

  const displayName = session.profile.full_name || session.email;

  const quickActions = [
    {
      title: 'Configure Widget',
      description: 'Customize colors, fonts, and branding',
      href: '/dashboard/widget/branding',
      icon: Palette,
    },
    {
      title: 'View Submissions',
      description: 'Manage leads and track conversions',
      href: '/dashboard/submissions',
      icon: FileText,
    },
    {
      title: 'Get Embed Code',
      description: 'Add the widget to your website',
      href: '/dashboard/widget/embed',
      icon: Code2,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-muted-foreground">
          Here is an overview of your treatment builder activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                The latest leads from your treatment builder widget
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/submissions">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentSubmissions && recentSubmissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubmissions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.first_name} {sub.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sub.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          statusStyles[sub.lead_status] ?? ''
                        }
                      >
                        {sub.lead_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">
                No submissions yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Submissions will appear here once your widget is live.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <action.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        {action.title}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
