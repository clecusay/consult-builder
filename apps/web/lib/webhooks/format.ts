/**
 * Webhook payload formatters.
 * Transforms generic submission payloads into platform-specific formats.
 */

export type WebhookFormat = 'generic' | 'discord' | 'slack' | 'crm_flat';

/**
 * Format a payload according to the target webhook format.
 *
 * 'crm_flat' expects an already-flattened body (see buildCrmFlatPayload) and
 * passes it through unchanged — it is the canonical CRM shape used by both the
 * stored lead and the delivered webhook, so the two never drift.
 */
export function formatWebhookPayload(
  format: WebhookFormat,
  payload: Record<string, unknown>
): Record<string, unknown> {
  switch (format) {
    case 'discord':
      return formatDiscord(payload);
    case 'slack':
      return formatSlack(payload);
    default:
      return payload;
  }
}

// ── CRM flat payload (canonical) ─────────────────────────

export interface CrmFlatInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender: string;
  /** Resolved location identifier for CRM mapping: slug when set, else UUID. */
  location_id?: string | null;
  location_uuid?: string | null;
  location_name?: string | null;
  selected_regions: Array<{ region_name?: string; region_slug?: string }>;
  selected_concerns: Array<{ concern_name?: string; region_name?: string }>;
  selected_services: Array<{ service_name?: string; category_name?: string }>;
  custom_fields: Record<string, unknown>;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  source_url?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  session_source?: string | null;
  sms_opt_in?: boolean;
  email_opt_in?: boolean;
  treatment_builder?: {
    pain_points: string[];
    desired_outcomes: string[];
    barriers: string[];
  };
}

/**
 * Build the flat CRM payload. This is the single source of truth for the
 * shape delivered to CRM webhooks (e.g. GHL inbound triggers) and mirrors the
 * browser-direct payload field-for-field, so a tenant's CRM field mapping is
 * identical whether the submission is forwarded by the browser or the backend.
 */
export function buildCrmFlatPayload(input: CrmFlatInput): Record<string, unknown> {
  return {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone ?? undefined,
    date_of_birth: input.date_of_birth ?? undefined,
    gender: input.gender,

    location_id: input.location_id ?? undefined,
    location_uuid: input.location_uuid ?? undefined,
    location_name: input.location_name ?? undefined,

    regions_summary: input.selected_regions.map((r) => r.region_name).filter(Boolean).join(', '),
    concerns_summary: input.selected_concerns.map((c) => c.concern_name).filter(Boolean).join(', '),
    services_summary: input.selected_services.map((s) => s.service_name).filter(Boolean).join(', '),

    selected_regions: input.selected_regions.map((r) => ({ name: r.region_name, slug: r.region_slug })),
    selected_concerns: input.selected_concerns.map((c) => ({ name: c.concern_name, region: c.region_name })),
    selected_services: input.selected_services.map((s) => ({ name: s.service_name, category: s.category_name })),
    custom_fields: input.custom_fields,

    utm_source: input.utm_source ?? undefined,
    utm_medium: input.utm_medium ?? undefined,
    utm_campaign: input.utm_campaign ?? undefined,
    utm_content: input.utm_content ?? undefined,
    utm_term: input.utm_term ?? undefined,
    gclid: input.gclid ?? undefined,
    fbclid: input.fbclid ?? undefined,
    source_url: input.source_url ?? undefined,
    landing_page: input.landing_page ?? undefined,
    referrer: input.referrer ?? undefined,
    session_source: input.session_source ?? undefined,

    sms_opt_in: input.sms_opt_in,
    email_opt_in: input.email_opt_in,

    ...(input.treatment_builder ? { treatment_builder: input.treatment_builder } : {}),
  };
}

/**
 * Whether HMAC signing should be skipped for a given format.
 * Some platforms (Discord, Slack incoming webhooks) don't support custom headers.
 */
export function shouldSkipSigning(format: WebhookFormat): boolean {
  return format === 'discord' || format === 'slack';
}

// ── Discord ──────────────────────────────────────────────

function formatDiscord(payload: Record<string, unknown>): Record<string, unknown> {
  const sub = payload.submission as Record<string, unknown> | undefined;
  if (!sub) return { content: 'New submission received.' };

  const name = [sub.first_name, sub.last_name].filter(Boolean).join(' ') || 'Unknown';
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  fields.push({ name: 'Name', value: name, inline: true });
  if (sub.email) fields.push({ name: 'Email', value: String(sub.email), inline: true });
  if (sub.phone) fields.push({ name: 'Phone', value: String(sub.phone), inline: true });
  if (sub.gender) fields.push({ name: 'Gender', value: String(sub.gender), inline: true });

  const regions = sub.selected_regions as { region_name: string }[] | undefined;
  if (regions?.length) {
    fields.push({ name: 'Regions', value: regions.map((r) => r.region_name).join(', ') });
  }

  const concerns = sub.selected_concerns as { concern_name: string }[] | undefined;
  if (concerns?.length) {
    fields.push({ name: 'Concerns', value: concerns.map((c) => c.concern_name).join(', ') });
  }

  const services = sub.selected_services as { service_name: string }[] | undefined;
  if (services?.length) {
    fields.push({ name: 'Services', value: services.map((s) => s.service_name).join(', ') });
  }

  if (sub.source_url) fields.push({ name: 'Source', value: String(sub.source_url) });

  return {
    embeds: [
      {
        title: '\u{1F4CB} New Consultation Request',
        color: 0x6366f1,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: `Submission ${sub.id || ''}`.trim() },
      },
    ],
  };
}

// ── Slack ────────────────────────────────────────────────

function formatSlack(payload: Record<string, unknown>): Record<string, unknown> {
  const sub = payload.submission as Record<string, unknown> | undefined;
  if (!sub) return { text: 'New submission received.' };

  const name = [sub.first_name, sub.last_name].filter(Boolean).join(' ') || 'Unknown';
  const lines: string[] = [`*${name}*`];

  if (sub.email) lines.push(`Email: ${sub.email}`);
  if (sub.phone) lines.push(`Phone: ${sub.phone}`);

  const regions = sub.selected_regions as { region_name: string }[] | undefined;
  if (regions?.length) lines.push(`Regions: ${regions.map((r) => r.region_name).join(', ')}`);

  const concerns = sub.selected_concerns as { concern_name: string }[] | undefined;
  if (concerns?.length) lines.push(`Concerns: ${concerns.map((c) => c.concern_name).join(', ')}`);

  const services = sub.selected_services as { service_name: string }[] | undefined;
  if (services?.length) lines.push(`Services: ${services.map((s) => s.service_name).join(', ')}`);

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'New Consultation Request' },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: lines.join('\n') },
      },
    ],
  };
}
