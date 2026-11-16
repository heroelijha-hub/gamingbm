import crypto from 'crypto';

const DOMAIN_CONTEXT = 'gamingbm-newsletter-double-optin-v1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getNewsletterHmacKey(): Buffer | string {
  if (process.env.NEWSLETTER_SECRET) {
    return process.env.NEWSLETTER_SECRET;
  }

  const baseSecret =
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET ||
    process.env.DATABASE_URL;

  if (!baseSecret) {
    throw new Error('Newsletter signing secret is not configured');
  }

  return crypto.createHmac('sha256', DOMAIN_CONTEXT).update(baseSecret).digest();
}

/**
 * Generates an HMAC-signed, time-limited double-opt-in token for newsletter confirmation.
 */
export function createNewsletterToken(email: string, ttlMs: number = 24 * 60 * 60 * 1000): string {
  const normalizedEmail = email.trim().toLowerCase();
  const expiry = Date.now() + ttlMs;
  const payload = `${normalizedEmail}|${expiry}`;
  const signature = crypto
    .createHmac('sha256', getNewsletterHmacKey())
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}|${signature}`).toString('base64');
}

export type NewsletterTokenResult =
  | { valid: true; email: string }
  | { valid: false; reason: 'invalid' | 'expired' };

/**
 * Verifies a newsletter double-opt-in token using constant-time HMAC comparison.
 */
export function verifyNewsletterToken(token: string): NewsletterTokenResult {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('|');
    if (parts.length !== 3) {
      return { valid: false, reason: 'invalid' };
    }

    const [email, expiry, signature] = parts;
    if (
      !email ||
      email.length > 254 ||
      !EMAIL_REGEX.test(email) ||
      !/^\d+$/.test(expiry) ||
      !/^[0-9a-f]{64}$/i.test(signature)
    ) {
      return { valid: false, reason: 'invalid' };
    }

    if (Date.now() > parseInt(expiry, 10)) {
      return { valid: false, reason: 'expired' };
    }

    const payload = `${email}|${expiry}`;
    const expectedSignature = crypto
      .createHmac('sha256', getNewsletterHmacKey())
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');

    if (
      expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
    ) {
      return { valid: false, reason: 'invalid' };
    }

    return { valid: true, email };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
}

