import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

const submissionSchema = z.object({
  tenant_slug: z.string().min(1),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.enum(['female', 'male', 'all']),
  selected_regions: z.array(
    z.object({
      region_id: z.string().uuid(),
      region_name: z.string(),
      region_slug: z.string(),
    })
  ),
  selected_concerns: z.array(
    z.object({
      concern_id: z.string().uuid(),
      concern_name: z.string(),
      region_id: z.string().uuid(),
      region_name: z.string(),
    })
  ),
  custom_fields: z.record(z.unknown()).default({}),
  source_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = submissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid submission', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createServiceRoleClient();

    // Look up tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, status')
      .eq('slug', data.tenant_slug)
      .eq('status', 'active')
      .single();

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get widget config for webhook
    const { data: config } = await supabase
      .from('widget_configs')
      .select('webhook_url, webhook_secret, notification_emails')
      .eq('tenant_id', tenant.id)
      .single();

    // Insert submission
    const { data: submission, error: insertError } = await supabase
      .from('form_submissions')
      .insert({
        tenant_id: tenant.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || null,
        gender: data.gender,
        selected_regions: data.selected_regions,
        selected_concerns: data.selected_concerns,
        custom_fields: data.custom_fields,
        source_url: data.source_url || null,
        lead_status: 'new',
        webhook_status: config?.webhook_url ? 'pending' : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to save submission:', insertError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    // Fire webhook (non-blocking)
    if (config?.webhook_url) {
      fireWebhook(supabase, submission.id, config.webhook_url, config.webhook_secret, {
        event: 'submission.created',
        submission: {
          id: submission.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          gender: data.gender,
          selected_regions: data.selected_regions,
          selected_concerns: data.selected_concerns,
          custom_fields: data.custom_fields,
          source_url: data.source_url,
          submitted_at: submission.created_at,
        },
      });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

// Fire webhook in background (don't await in request handler)
async function fireWebhook(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  submissionId: string,
  webhookUrl: string,
  webhookSecret: string | null,
  payload: Record<string, unknown>
) {
  try {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (webhookSecret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const hex = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      headers['X-TB-Signature'] = `sha256=${hex}`;
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
      signal: AbortSignal.timeout(10000),
    });

    await supabase
      .from('form_submissions')
      .update({
        webhook_status: res.ok ? 'sent' : 'failed',
        webhook_sent_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
  } catch (err) {
    console.error('Webhook delivery failed:', err);
    await supabase
      .from('form_submissions')
      .update({ webhook_status: 'failed' })
      .eq('id', submissionId);
  }
}
