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
import { Shield, ScrollText } from 'lucide-react';

export default async function AuditLogPage() {
  await requireRole(['platform_admin']);
  const supabase = await createServerSupabaseClient();

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const allLogs = logs ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Platform Admin
          </Badge>
        </div>
        <p className="text-muted-foreground">
          View a log of all administrative actions across the platform
        </p>
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing the last {allLogs.length} audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">
                          {log.entity_type}
                        </span>
                        {log.entity_id && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.user_id ? (
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {log.user_id.slice(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">
                          System
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <ScrollText className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No audit log entries
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                Administrative actions will be recorded here as they occur across
                the platform.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
