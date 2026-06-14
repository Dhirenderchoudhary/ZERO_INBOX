import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { auth } from "@/lib/auth";

const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`;

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return new NextResponse("Missing code.", { status: 400 });
  }

  // Version 0.1.74 uses state. Check if state was passed.
  if (state) {
    const storedState = request.cookies.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return new NextResponse("Invalid state.", { status: 400 });
    }
  }

  try {
    const result = await processOAuthCallback(corsair, {
      code,
      state: state || "",
      redirectUri: REDIRECT_URI,
    });
    const response = NextResponse.redirect(
      `${env.NEXT_PUBLIC_APP_URL}/inbox?connected=` + result.plugin,
    );
    response.cookies.delete("oauth_state");
    return response;
  } catch (e: any) {
    console.error(e);
    const response = new NextResponse(`OAuth failed: ${e?.message || e}`, {
      status: 500,
    });
    response.cookies.delete("oauth_state");
    return response;
  }
}
