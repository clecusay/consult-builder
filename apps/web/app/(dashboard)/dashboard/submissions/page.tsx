import { requireSession } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { SubmissionsTable } from './submissions-table';

export default async function SubmissionsPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: submissions, error } = await supabase
    .from('form_submissions')
    .select(
      'id, first_name, last_name, email, phone, gender, selected_regions, selected_concerns, selected_services, custom_fields, lead_status, source_url, created_at'
    )
    .eq('tenant_id', session.profile.tenant_id)
    .order('created_at', { ascending: false });

  if (error) console.error('[submissions] Query failed:', error);

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
            <SubmissionsTable submissions={submissions} />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No submissions yet"
              description="Once your widget is embedded on your website and visitors start submitting the form, their submissions will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
