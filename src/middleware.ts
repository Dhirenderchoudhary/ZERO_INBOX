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
  });
}

export async function middleware(req: NextRequest) {
  // Apply rate limiting to all /api routes if Redis is configured
  if (ratelimit) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests. Global rate limit exceeded." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect all API routes, including TRPC and webhooks
  matcher: "/api/:path*",
};
