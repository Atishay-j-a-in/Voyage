import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUser } from '@clerk/nextjs/server'
import { userPreferences } from "@/db/schema";
import { db } from "@/db/db";

const getUserId = async () => {
    const user = await currentUser();
   
    if(!user){
        throw new Error('User not found');
    }
    return { tenantid: user.id , email:user.emailAddresses[0].emailAddress} ;
}

const REDIRECT_URI = `${process.env.APP_URL}/api/auth`;

export async function GET(request: NextRequest) {
    const { tenantid, email } = await getUserId(); // your auth logic
    if (!tenantid || !email) {
        throw new Error('User ID not found');
    }
    await db
        .insert(userPreferences)
        .values({
            tenantid: tenantid,
            isOrbActive: true,
            emailid: email,
            isCalendarConnected: false,
            isMailConnected: false,
        })
        .onConflictDoNothing({
            target: userPreferences.tenantid,
        });
    const plugin = new URL(request.url).searchParams.get("plugin")!;

    const { url, state } = await generateOAuthUrl(corsair, plugin, {
        tenantId: tenantid,
        redirectUri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(url);
    response.cookies.set("oauth_state", state, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10,
    });
    return response;
}