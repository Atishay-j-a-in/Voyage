import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/server/corsair";

/**
 * POST /api/emails/send
 *
 * Sends an email via the Gmail API using corsair.
 * Body: { to: string, subject: string, body: string }
 */
export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { to, subject, body } = (await req.json()) as {
      to: string;
      subject: string;
      body: string;
    };

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject" },
        { status: 400 },
      );
    }

    const tenant = corsair.withTenant(userId);

    // Build the raw email message as base64url encoded RFC 2822
    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      "",
      body || "",
    ].join("\r\n");

    // Encode to base64url
    const base64 = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await (tenant.gmail.api.messages as any).send({
      raw: base64,
    });

    console.log("[api/emails/send] Email sent:", result);

    return NextResponse.json({ success: true, messageId: result?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/emails/send] Failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
