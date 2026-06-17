import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

// Only initialize rate limiting if Redis environment variables are available
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "10 s"),
    prefix: "zeroinbox:global",
  });
}

/** Extracts the real client IP from common proxy headers. */
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first (original client)
    return forwardedFor.split(",")[0]!.trim();
  }
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

/** Security headers applied to every API response. */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export async function middleware(req: NextRequest) {
  // ── Rate limiting (active when Upstash Redis env vars are set) ────────────
  if (ratelimit) {
    const ip = getClientIp(req);
    const { success, limit, remaining } = await ratelimit.limit(ip);

    if (!success) {
      const res = NextResponse.json(
        { error: "Too Many Requests. Global rate limit exceeded." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "Retry-After": "10",
          },
        },
      );
      for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
        res.headers.set(k, v);
      }
      return res;
    }
  }

  // ── Pass through with security headers ───────────────────────────────────
  const response = NextResponse.next();
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export const config = {
  // Protect all API routes, including TRPC and webhooks
  matcher: "/api/:path*",
};
