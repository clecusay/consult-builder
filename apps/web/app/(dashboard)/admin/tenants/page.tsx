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

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-100 text-red-700',
};

const planStyles: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

export default async function ManageTenantsPage() {
  await requireRole(['platform_admin']);
  const supabase = await createServerSupabaseClient();

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug, status, billing_plan, created_at')
    .order('created_at', { ascending: false });

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
                        className={statusStyles[tenant.status] ?? ''}
                      >
                        {tenant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={planStyles[tenant.billing_plan] ?? ''}
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <Building2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No tenants registered
              </h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
