import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/server/corsair";

/**
 * POST /api/emails/reply
 *
 * Sends a reply, reply-all, or forward email via the Gmail API.
 * Body: {
 *   action: "reply" | "replyAll" | "forward",
 *   to: string,          // required for forward, ignored for reply/replyAll
 *   subject: string,
 *   body: string,
 *   originalFrom?: string,
 *   originalBody?: string,
 * }
 */
export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, to, subject, body, originalFrom, originalBody } = (await req.json()) as {
      action: "reply" | "replyAll" | "forward";
      to?: string;
      subject: string;
      body: string;
      originalFrom?: string;
      originalBody?: string;
    };

    if (!subject) {
      return NextResponse.json({ error: "Missing subject" }, { status: 400 });
    }

    const tenant = corsair.withTenant(userId);

    // Determine recipients
    let recipients = "";
    if (action === "forward") {
      if (!to) {
        return NextResponse.json({ error: "Missing 'to' for forward" }, { status: 400 });
      }
      recipients = to;
    } else {
      // reply / replyAll — use the original sender
      recipients = originalFrom ?? "";
    }

    // Build subject with prefix
    let finalSubject = subject;
    if (action === "reply" || action === "replyAll") {
      if (!finalSubject.startsWith("Re:")) {
        finalSubject = `Re: ${finalSubject}`;
      }
    } else if (action === "forward") {
      if (!finalSubject.startsWith("Fw:")) {
        finalSubject = `Fw: ${finalSubject}`;
      }
    }

    // Build body with quoted original
    let finalBody = body || "";
    if (originalBody) {
      const quoted = originalBody
        .split("\n")
        .map((line) => `> ${line}`)
        .join("\n");
      finalBody = `${finalBody}\n\n${quoted}`;
    }

    // Build raw RFC 2822 message
    const rawMessage = [
      `To: ${recipients}`,
      `Subject: ${finalSubject}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      "",
      finalBody,
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

    console.log(`[api/emails/reply] ${action} sent:`, result);

    return NextResponse.json({ success: true, messageId: result?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/emails/reply] Failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
