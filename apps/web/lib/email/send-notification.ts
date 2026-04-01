import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SubmissionData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  location?: string | null;
  gender: string;
  area_of_concern: string;
  concerns: string;
  source_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  submitted_at: string;
}

export async function sendNotificationEmails(
  notificationEmails: string[],
  tenantName: string,
  submission: SubmissionData,
) {
  if (notificationEmails.length === 0) return;

  const rows = [
    { label: 'Name', value: `${submission.first_name} ${submission.last_name}` },
    { label: 'Email', value: submission.email },
    submission.phone ? { label: 'Phone', value: submission.phone } : null,
    submission.date_of_birth ? { label: 'Date of Birth', value: submission.date_of_birth } : null,
    submission.location ? { label: 'Location', value: submission.location } : null,
    { label: 'Gender', value: submission.gender },
    submission.area_of_concern ? { label: 'Areas of Concern', value: submission.area_of_concern } : null,
    submission.concerns ? { label: 'Concerns', value: submission.concerns } : null,
    submission.source_url ? { label: 'Source', value: submission.source_url } : null,
    submission.utm_source ? { label: 'UTM Source', value: submission.utm_source } : null,
    submission.utm_medium ? { label: 'UTM Medium', value: submission.utm_medium } : null,
    submission.utm_campaign ? { label: 'UTM Campaign', value: submission.utm_campaign } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const tableRows = rows
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px;font-weight:600;color:#475569;white-space:nowrap;vertical-align:top">${r.label}</td><td style="padding:8px 12px;color:#1e293b">${r.value}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
        <h2 style="margin:0;font-size:18px;font-weight:600">New Consultation Request</h2>
        <p style="margin:6px 0 0;font-size:13px;color:#94a3b8">${tenantName}</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:4px 0">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${tableRows}
        </table>
      </div>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center">
        Sent by Consult Intake
      </p>
    </div>
  `;

  const results = await Promise.allSettled(
    notificationEmails.map((to) =>
      resend.emails.send({
        from: 'Consult Intake <notifications@consultintake.com>',
        to,
        subject: `New Consultation: ${submission.first_name} ${submission.last_name}`,
        html,
      })
    )
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    console.error('Some notification emails failed:', failed);
  }
}
