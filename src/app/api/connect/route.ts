import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/env";

const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/auth`;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const tenantId = env.TENANT_ID ?? 'dev';
    const plugin = new URL(request.url).searchParams.get("plugin");

    if (!plugin) {
        return new NextResponse("Missing plugin parameter", { status: 400 });
    }

    try {
        const { url, state } = await generateOAuthUrl(corsair, plugin, {
            tenantId,
            redirectUri: REDIRECT_URI,
        });

        const response = NextResponse.redirect(url);
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        response.cookies.set("oauth_state", state, {
            httpOnly: true,
            sameSite: "lax",
            secure: env.NODE_ENV === "production",
            maxAge: 60 * 10,
        });
        return response;
    } catch (e) {
        console.error(e);
        return new NextResponse("Failed to generate OAuth URL", { status: 500 });
    }
}
