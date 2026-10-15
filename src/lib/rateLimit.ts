import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Optional Upstash Redis instance
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (redisUrl && redisToken) {
  try {
    redis = new Redis({ url: redisUrl, token: redisToken });
  } catch (err) {
    console.error('[RateLimit] Failed to initialize Redis:', err);
  }
}

// In-memory fallback sliding window cache
interface MemoryRateLimitRecord {
  timestamps: number[];
}
const memoryStore = new Map<string, MemoryRateLimitRecord>();

// Cleanup stale memory records periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      // Remove records whose newest timestamp is older than 1 hour
      const last = record.timestamps[record.timestamps.length - 1];
      if (!last || now - last > 3600_000) {
        memoryStore.delete(key);
      }
    }
  }, 300_000);
}

/**
 * Check if an action is within rate limits.
 *
 * @param identifier Unique key (e.g. `login_${ip}`, `newsletter_${ip}_${email}`)
 * @param limit Max allowed requests within window
 * @param windowSeconds Window length in seconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; reset: number; remaining: number }> {
  const now = Date.now();

  // 1. Try Upstash Redis if configured
  if (redis) {
    try {
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        prefix: 'topkamin_rl',
      });
      const result = await ratelimit.limit(identifier);
      return {
        success: result.success,
        reset: result.reset,
        remaining: result.remaining,
      };
    } catch (err) {
      console.warn('[RateLimit] Redis check failed, falling back to in-memory:', err);
    }
  }

  // 2. Fallback to in-memory sliding window
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = memoryStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldestInWindow = record.timestamps[0];
    const reset = oldestInWindow + windowMs;
    return {
      success: false,
      reset,
      remaining: 0,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    reset: now + windowMs,
    remaining: limit - record.timestamps.length,
  };
}

/**
 * Helper to get the caller's IP from request headers.
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
      // Return the first IP in the comma-separated chain
      const clientIp = forwarded.split(',')[0].trim();
      if (clientIp) return clientIp;
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) return realIp.trim();
  } catch {
    // If called outside of a request context
  }
  return '127.0.0.1';
}
