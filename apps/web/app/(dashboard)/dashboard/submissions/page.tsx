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
import { SubmissionsTable } from './submissions-table';

export default async function SubmissionsPage() {
  const session = await requireSession();
  const supabase = await createServerSupabaseClient();

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select(
      'id, first_name, last_name, email, phone, gender, selected_regions, selected_concerns, selected_services, custom_fields, lead_status, source_url, created_at'
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
            <SubmissionsTable submissions={submissions} />
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
