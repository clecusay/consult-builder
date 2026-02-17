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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Inbox } from 'lucide-react';

const statusStyles: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
};

export default async function SubmissionsPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select(
      'id, first_name, last_name, email, phone, selected_regions, lead_status, created_at'
    )
    .eq('tenant_id', session.profile.tenant_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
        <p className="text-muted-foreground">
          Manage leads from your treatment builder widget
        </p>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            {submissions?.length ?? 0} total submission
            {submissions?.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Regions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => {
                  const regions = Array.isArray(sub.selected_regions)
                    ? (
                        sub.selected_regions as Array<{
                          region_name?: string;
                        }>
                      )
                        .map((r) => r.region_name)
                        .filter(Boolean)
                        .join(', ')
                    : '';

                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {sub.first_name} {sub.last_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.phone || '--'}
                      </TableCell>
                      <TableCell>
                        {regions ? (
                          <span className="text-sm text-muted-foreground">
                            {regions}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">
                            --
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusStyles[sub.lead_status] ?? ''}
                        >
                          {sub.lead_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <Inbox className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No submissions yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                Once your widget is embedded on your website and visitors start
                submitting the form, their submissions will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
