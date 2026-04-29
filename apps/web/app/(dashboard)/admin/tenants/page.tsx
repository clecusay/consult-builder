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
import { Shield, Building2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TENANT_STATUS_STYLES, PLAN_STYLES } from '@/lib/constants/badge-styles';

export default async function ManageTenantsPage() {
  await requireRole(['platform_admin']);
  const supabase = await createServerSupabaseClient();

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('id, name, slug, status, billing_plan, created_at')
    .order('created_at', { ascending: false });

  if (error) console.error('[admin/tenants] Query failed:', error);
  const allTenants = tenants ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">All Tenants</h1>
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Platform Admin
          </Badge>
        </div>
        <p className="text-muted-foreground">
          View and manage all registered centers on the platform
        </p>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Tenants</CardTitle>
          <CardDescription>
            {allTenants.length} total tenant{allTenants.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allTenants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      {tenant.name}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {tenant.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={TENANT_STATUS_STYLES[tenant.status] ?? ''}
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={PLAN_STYLES[tenant.billing_plan] ?? ''}
                      >
                        {tenant.billing_plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Building2}
              title="No tenants registered"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
