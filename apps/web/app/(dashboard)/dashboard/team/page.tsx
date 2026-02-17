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

const roleStyles: Record<string, string> = {
  platform_admin: 'bg-red-100 text-red-700',
  center_admin: 'bg-blue-100 text-blue-700',
  center_staff: 'bg-gray-100 text-gray-700',
};

const roleLabels: Record<string, string> = {
  platform_admin: 'Platform Admin',
  center_admin: 'Admin',
  center_staff: 'Staff',
};

export default async function TeamPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: members } = await supabase
    .from('user_profiles')
    .select('id, user_id, full_name, role, created_at')
    .eq('tenant_id', session.profile.tenant_id)
    .order('created_at', { ascending: true });

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
                        className={roleStyles[member.role] ?? ''}
                      >
                        {roleLabels[member.role] ?? member.role}
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
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No team members
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                Invite team members to collaborate on managing your treatment
                builder.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
