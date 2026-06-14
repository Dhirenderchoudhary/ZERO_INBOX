import { generateOAuthUrl } from "corsair/oauth";
import { setupCorsair } from "corsair";
import { corsair } from "@/server/corsair";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { env } from "@/env";

const REDIRECT_URI = `${env.NEXT_PUBLIC_APP_URL}/api/corsair/callback`;
const ALLOWED_PLUGINS = ['gmail', 'googlecalendar'] as const;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const plugin = request.nextUrl.searchParams.get("plugin");
    if (!plugin || !ALLOWED_PLUGINS.includes(plugin as any)) {
        return Response.json({ error: 'Invalid plugin' }, { status: 400 });
    }

    try {
        await setupCorsair(corsair, { tenantId: session.user.id });

        const { url, state } = await generateOAuthUrl(corsair, plugin, {
            tenantId: session.user.id,
            redirectUri: REDIRECT_URI,
        });

        const response = NextResponse.redirect(url);
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        if (state) {
            response.cookies.set("oauth_state", state, {
                httpOnly: true,
                sameSite: "lax",
                secure: env.NODE_ENV === "production",
                maxAge: 60 * 10,
            });
        }
        return response;
    } catch (e) {
        console.error(e);
        return new NextResponse("Failed to generate OAuth URL", { status: 500 });
    }
}
