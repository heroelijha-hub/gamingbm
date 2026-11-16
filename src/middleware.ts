import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis and Ratelimit if env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
let adminRatelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
  const redis = new Redis({ url: redisUrl, token: redisToken });
  // Public site: 60 requests / 10 s per IP (Next.js prefetching fires bursts of requests)
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '10 s'),
    analytics: true,
    prefix: 'gamingbm_mw_public',
  });
  // Back-office: much wider window (sidebar prefetch + notification polling),
  // but NEVER exempt: a hard cap still protects /admin from floods.
  // Brute-force protection of the login itself is enforced per action (loginAdmin).
  adminRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(300, '10 s'),
    analytics: true,
    prefix: 'gamingbm_mw_admin',
  });
}

function tooManyRequests(request: NextRequest, limit: number, remaining: number, reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString();
  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
    'Retry-After': retryAfter,
  };

  // Never answer RSC / Server Action / JSON requests with an HTML page: the
  // Next.js client router cannot parse it and shows the "reload" error screen.
  const isRSC = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc');
  const isAction = request.headers.has('next-action');
  if (isRSC || isAction || request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({ error: 'Too Many Requests', retryAfter: Number(retryAfter) }, { status: 429, headers });
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><title>429 Too Many Requests</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family: system-ui; text-align: center; padding: 2rem; background: #f9fafb;"><h1 style="color: #ef4444;">Access temporarily blocked</h1><p>You have sent too many requests in a short time.</p><p>For security reasons, please wait a few seconds before trying again.</p></body></html>`,
    { status: 429, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function middleware(request: NextRequest) {
  // 1. Rate limiting (anti-DDoS / brute force).
  // SECURITY: no bypass based on request headers (Purpose / x-middleware-prefetch are
  // client-controlled and trivially spoofable). /admin uses a wider dedicated limiter.
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const limiter = isAdminRoute ? adminRatelimit : ratelimit;

  if (limiter) {
    // Get IP address from headers (Vercel sets x-forwarded-for)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (request as any).ip ?? '127.0.0.1';

    try {
      const { success, limit, reset, remaining } = await limiter.limit(`ip_${ip}`);
      if (!success) {
        return tooManyRequests(request, limit, remaining, reset);
      }
    } catch (err) {
      // Fail open if Redis is unreachable: never take the whole site down.
      console.error('[Middleware] Rate limiter error:', err);
    }
  }

  // 2. Update Supabase session
  const response = await updateSession(request)

  // Custom route protection logic
  // For example, redirect unauthenticated users away from /account
  const url = request.nextUrl.clone()
  
  if (url.pathname.startsWith('/account')) {
    // We can parse the session cookies to see if there is an auth token
    const hasSession = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'))
    
    if (!hasSession) {
      url.pathname = '/login'
      return Response.redirect(url)
    }
  }

  // Set x-pathname to be used by i18n
  response.headers.set('x-pathname', url.pathname)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
