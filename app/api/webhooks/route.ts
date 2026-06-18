import { processWebhook } from 'corsair';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/server/corsair';
import { db } from '@/db/db';
import { eq } from 'drizzle-orm';
import { userPreferences } from '@/db/schema';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });

    const body = request.headers.get('content-type')?.includes('application/json')
        ? await request.json()
        : await request.text();

    const decoded = JSON.parse(
        Buffer.from(body.message.data, "base64").toString("utf8")
    );

    const email = decoded.emailAddress;
    const tenantId = await db.select({ tenantid: userPreferences.tenantid }).from(userPreferences).where(eq(userPreferences.emailid, email))

    const result = await processWebhook(corsair, headers, body, { tenantId: tenantId[0].tenantid });
    console.log('Webhook processed:', result);
    if (
        result.plugin === "gmail" &&
        result.action === "messageChanged"
    ) {


        await inngest.send({
            name: "gmail/message.changed",
            data: {
                emailAddress: email,
                historyId: decoded.historyId,
            },
        });
    }
    if (!result.response) {
        return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json(result.response);
}