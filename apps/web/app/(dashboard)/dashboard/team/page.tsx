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
import { Users, UserPlus } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ROLE_STYLES, ROLE_LABELS } from '@/lib/constants/badge-styles';

export default async function TeamPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: members, error } = await supabase
    .from('user_profiles')
    .select('id, user_id, full_name, role, created_at')
    .eq('tenant_id', session.profile.tenant_id)
    .order('created_at', { ascending: true });

  if (error) console.error('[team] Query failed:', error);
  const allMembers = members ?? [];

  // Fetch emails for each member via auth users
  // Since we cannot directly join auth.users from client, we construct the display
  // from user_profiles data. Email would need to come from a server function or view.
  // For now, we show what we have.

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage team members and roles
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Team Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {allMembers.length} member{allMembers.length !== 1 ? 's' : ''} in
            your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.full_name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={ROLE_STYLES[member.role] ?? ''}
                      >
                        {ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Users}
              title="No team members"
              description="Invite team members to collaborate on managing your treatment builder."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
