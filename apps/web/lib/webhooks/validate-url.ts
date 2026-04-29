import { resolve4, resolve6 } from 'node:dns/promises';

/**
 * SSRF protection: validates that a webhook URL does not resolve to a
 * private/internal IP address before we fetch it.
 */

/** IPv4 CIDR ranges that must be blocked. */
const BLOCKED_IPV4_RANGES: Array<{ network: number; mask: number; label: string }> = [
  { network: ip4ToInt('127.0.0.0'), mask: cidrMask(8), label: 'loopback' },
  { network: ip4ToInt('10.0.0.0'), mask: cidrMask(8), label: 'private (10.x)' },
  { network: ip4ToInt('172.16.0.0'), mask: cidrMask(12), label: 'private (172.16.x)' },
  { network: ip4ToInt('192.168.0.0'), mask: cidrMask(16), label: 'private (192.168.x)' },
  { network: ip4ToInt('169.254.0.0'), mask: cidrMask(16), label: 'link-local' },
  { network: ip4ToInt('0.0.0.0'), mask: cidrMask(8), label: 'unspecified' },
];

/** IPv6 addresses/prefixes that must be blocked. */
const BLOCKED_IPV6 = ['::1', 'fc00::', 'fd00::', 'fe80::', '2001:db8::'];

function ip4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidrMask(bits: number): number {
  return (~0 << (32 - bits)) >>> 0;
}

function isBlockedIPv4(ip: string): string | null {
  const addr = ip4ToInt(ip);
  for (const range of BLOCKED_IPV4_RANGES) {
    if ((addr & range.mask) === (range.network & range.mask)) {
      return range.label;
    }
  }
  return null;
}

function isBlockedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1') return true;
  for (const prefix of BLOCKED_IPV6) {
    if (normalized.startsWith(prefix)) return true;
  }
  return false;
}

/**
 * Asserts that the given URL is safe to fetch (not pointing at private/internal IPs).
 * Throws an error if the URL resolves to a blocked address.
 */
export async function assertSafeUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  // Only allow http and https protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Blocked webhook URL: unsupported protocol ${parsed.protocol}`);
  }

  const hostname = parsed.hostname;

  // Allow localhost in development only
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) return;
    throw new Error('Blocked webhook URL: localhost is not allowed in production');
  }

  // Check if hostname is already an IP literal
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    const blocked = isBlockedIPv4(hostname);
    if (blocked) {
      throw new Error(`Blocked webhook URL: resolves to ${blocked} address`);
    }
    return;
  }

  // Check for IPv6 literal (brackets stripped by URL parser)
  if (hostname.includes(':')) {
    if (isBlockedIPv6(hostname)) {
      throw new Error('Blocked webhook URL: resolves to private IPv6 address');
    }
    return;
  }

  // Resolve hostname and check all resulting IPs
  const errors: string[] = [];
  let resolved = false;

  try {
    const ipv4Addresses = await resolve4(hostname);
    resolved = true;
    for (const ip of ipv4Addresses) {
      const blocked = isBlockedIPv4(ip);
      if (blocked) {
        throw new Error(`Blocked webhook URL: ${hostname} resolves to ${blocked} address (${ip})`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Blocked')) throw err;
    errors.push('IPv4 resolution failed');
  }

  try {
    const ipv6Addresses = await resolve6(hostname);
    resolved = true;
    for (const ip of ipv6Addresses) {
      if (isBlockedIPv6(ip)) {
        throw new Error(`Blocked webhook URL: ${hostname} resolves to private IPv6 address (${ip})`);
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Blocked')) throw err;
    errors.push('IPv6 resolution failed');
  }

  if (!resolved) {
    throw new Error(`Blocked webhook URL: could not resolve hostname ${hostname}`);
  }
}
