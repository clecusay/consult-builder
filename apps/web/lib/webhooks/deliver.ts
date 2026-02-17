/**
 * Webhook delivery with HMAC-SHA256 signing.
 * Used for delivering form submissions to tenant webhook URLs.
 */
export async function deliverWebhook(
  url: string,
  secret: string | null,
  payload: Record<string, unknown>
): Promise<{ ok: boolean; status: number }> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'TreatmentBuilder-Webhook/1.0',
  };

  if (secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const hex = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    headers['X-TB-Signature'] = `sha256=${hex}`;
    headers['X-TB-Timestamp'] = Math.floor(Date.now() / 1000).toString();
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
    signal: AbortSignal.timeout(10000),
  });

  return { ok: res.ok, status: res.status };
}
