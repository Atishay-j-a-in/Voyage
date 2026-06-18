import { processOAuthCallback } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REDIRECT_URI = `${process.env.APP_URL}/api/auth`;

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
        const response = new NextResponse("Missing code or state.", { status: 400 });
        response.cookies.delete("oauth_state");
        return response;
    }

    const storedState = request.cookies.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
        const response = new NextResponse("Invalid state.", { status: 400 });
        response.cookies.delete("oauth_state");
        return response;
    }

    try {
        const result = await processOAuthCallback(corsair, { code, state, redirectUri: REDIRECT_URI });
        const response = NextResponse.redirect("/workspace?connected=" + result.plugin);
        response.cookies.delete("oauth_state");
        return response;
    } catch {
        const response = new NextResponse("OAuth failed.", { status: 500 });
        response.cookies.delete("oauth_state");
        return response;
    }
}