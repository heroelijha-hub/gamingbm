import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF protection for server-side downloads of URLs coming from third parties
 * (e.g. image URLs returned by a remote WooCommerce store).
 *
 * - http(s) only, no credentials in the URL, no exotic ports
 * - hostname must NOT resolve to a private / loopback / link-local / metadata address
 * - redirects are followed manually and re-validated at every hop
 * - hard timeout and size cap
 */

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_PORTS = new Set(['', '80', '443']);

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 0 || // "this" network
    a === 10 || // private
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local + cloud metadata (169.254.169.254)
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 0) || // IETF protocol assignments
    (a === 192 && b === 168) || // private
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast / reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  // Allowlist approach: only global unicast (2000::/3) is accepted. This rejects
  // loopback (::1), unspecified (::), IPv4-mapped/compatible (::ffff:a.b.c.d, which the URL
  // parser normalises to hex form), unique-local (fc00::/7), link-local (fe80::/10),
  // multicast (ff00::/8), NAT64 (64:ff9b::/96) and every other special range.
  const v = ip.toLowerCase();
  if (!/^[23]/.test(v)) return true;
  // Inside 2000::/3, also reject 6to4 (2002::/16) and Teredo (2001:0::/32) which embed IPv4 addresses.
  if (v.startsWith('2002:') || v.startsWith('2001:0:') || v.startsWith('2001:0000:')) return true;
  return false;
}

function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true;
}

/** Throws if the URL is not safe to fetch from the server. */
export async function assertSafeRemoteUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http(s) URLs are allowed');
  }
  if (url.username || url.password) {
    throw new Error('Credentials in URL are not allowed');
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new Error('Port not allowed');
  }

  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('Host not allowed');
  }

  // Literal IP, or resolve the hostname and check EVERY returned address.
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new Error('Host resolves to a private or reserved address');
  }
  return url;
}

/**
 * Download a remote image safely. Returns the bytes + content type.
 * Throws on any policy violation (caller decides how to handle).
 */
export async function fetchRemoteImage(
  rawUrl: string,
  opts: { timeoutMs?: number; maxBytes?: number } = {}
): Promise<{ buffer: Buffer; contentType: string }> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;

  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertSafeRemoteUrl(current);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'image/*' },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect without location');
      current = new URL(location, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);

    const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) {
      throw new Error('Remote file is not an image');
    }

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new Error('Remote image too large');

    // Stream with a hard cap (content-length can lie / be absent)
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Empty response body');
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Remote image too large');
      }
      chunks.push(value);
    }
    return { buffer: Buffer.concat(chunks), contentType };
  }
  throw new Error('Too many redirects');
}
