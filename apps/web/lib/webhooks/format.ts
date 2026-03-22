/**
 * Webhook payload formatters.
 * Transforms generic submission payloads into platform-specific formats.
 */

export type WebhookFormat = 'generic' | 'discord' | 'slack';

/**
 * Format a payload according to the target webhook format.
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
