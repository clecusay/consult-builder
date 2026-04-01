import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { deliverWebhook } from '@/lib/webhooks/deliver';
import { type WebhookFormat } from '@/lib/webhooks/format';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

const submissionSchema = z.object({
  tenant_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional(),
  gender: z.enum(['female', 'male', 'all']),
  selected_regions: z.array(
    z.object({
      region_id: z.string().uuid(),
      region_name: z.string(),
      region_slug: z.string(),
    })
  ).min(1, 'At least one body region must be selected'),
  selected_concerns: z.array(
    z.object({
      concern_id: z.string().uuid(),
      concern_name: z.string(),
      region_id: z.string().uuid(),
      region_name: z.string(),
    })
  ),
  selected_services: z.array(
    z.object({
      service_id: z.string().uuid(),
      service_name: z.string(),
      category_name: z.string(),
    })
  ).default([]),
  custom_fields: z.record(z.unknown()).default({}),
  sms_opt_in: z.boolean().optional(),
  email_opt_in: z.boolean().optional(),
  source_url: z.string().url().optional(),
});

const submitLimiter = rateLimit({ limit: 10, windowMs: 60_000, keyPrefix: 'submit' });

export async function POST(request: Request) {
  try {
    // Rate limit: 10 submissions per minute per IP
    const rl = submitLimiter(request);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        {
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      console.warn('Submission validation failed:', JSON.stringify(parsed.error.flatten()));
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const safeErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages && messages.length > 0) {
          safeErrors[key] = messages[0];
        }
      }
      return NextResponse.json(
        { error: 'Please check your submission and try again.', fields: safeErrors },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const data = parsed.data;
    const supabase = await createServiceRoleClient();

    // Verify tenant exists and is active
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('id', data.tenant_id)
      .eq('status', 'active')
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Parallel: validate location + fetch webhook config (both need tenant.id)
    const [locationResult, configResult] = await Promise.all([
      data.location_id
        ? supabase.from('tenant_locations').select('id').eq('id', data.location_id).eq('tenant_id', tenant.id).single()
        : Promise.resolve({ data: { id: '' }, error: null }),
      supabase.from('widget_configs').select('webhook_url, webhook_secret, webhook_format, notification_emails').eq('tenant_id', tenant.id).single(),
    ]);

    if (data.location_id && (locationResult.error || !locationResult.data)) {
      return NextResponse.json({ error: 'Location not found for this tenant' }, { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const config = configResult.data;

    // Merge opt-in values into custom_fields for storage
    const customFields = { ...data.custom_fields };
    if (data.sms_opt_in !== undefined) customFields['SMS Opt-In'] = data.sms_opt_in;
    if (data.email_opt_in !== undefined) customFields['Email Opt-In'] = data.email_opt_in;

    // Insert submission
    const { data: submission, error: insertError } = await supabase
      .from('form_submissions')
      .insert({
        tenant_id: tenant.id,
        location_id: data.location_id || null,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        gender: data.gender,
        selected_regions: data.selected_regions,
        selected_concerns: data.selected_concerns,
        selected_services: data.selected_services,
        custom_fields: customFields,
        source_url: data.source_url || null,
        lead_status: 'new',
        webhook_status: config?.webhook_url ? 'pending' : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save submission:', insertError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    // Fire webhook (non-blocking)
    if (config?.webhook_url) {
      (async () => {
        try {
          const result = await deliverWebhook(
            config.webhook_url,
            config.webhook_secret,
            {
              event: 'submission.created',
              submission: {
                id: submission.id,
                tenant_id: tenant.id,
                location_id: data.location_id || null,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                selected_regions: data.selected_regions,
                selected_concerns: data.selected_concerns,
                selected_services: data.selected_services,
                custom_fields: customFields,
                sms_opt_in: data.sms_opt_in,
                email_opt_in: data.email_opt_in,
                source_url: data.source_url,
                submitted_at: submission.created_at,
              },
            },
            (config.webhook_format as WebhookFormat) ?? 'generic'
          );

          await supabase
            .from('form_submissions')
            .update({
              webhook_status: result.ok ? 'sent' : 'failed',
              webhook_sent_at: new Date().toISOString(),
            })
            .eq('id', submission.id);
        } catch (err) {
          console.error('Webhook delivery failed:', err);
          await supabase
            .from('form_submissions')
            .update({ webhook_status: 'failed' })
            .eq('id', submission.id);
        }
      })();
    }

    return NextResponse.json(
      { success: true, id: submission.id },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
