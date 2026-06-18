import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { chatSessions, chatMessages, subscriptions, aiUsageEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ai } from "@/server/agent";

/**
 * POST /api/chat
 * Body: { message: string, sessionId?: string }
 *
 * Streams the AI response via SSE while saving to chat memory.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const userText = body.message?.trim();
  const sessionId = body.sessionId;

  if (!userText) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Check subscription token limit
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, userId))
    .limit(1);

  const sub = subRows[0];
  if (sub && sub.tokenUsed >= sub.tokenLimit) {
    return NextResponse.json(
      { error: "Token limit reached. Upgrade your plan." },
      { status: 429 }
    );
  }

  // Find or create session
  let sid = sessionId;
  if (!sid) {
    const [session] = await db
      .insert(chatSessions)
      .values({ tenantid: userId, title: userText.slice(0, 80) })
      .returning();
    sid = session.id;
  }

  // Save user message
  await db.insert(chatMessages).values({
    sessionId: sid,
    usertext: userText,
    agenttext: "", // filled after streaming completes
  });

  // Build conversation history for context
  const history = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sid))
    .orderBy(chatMessages.createdAt);

  // Build prompt with history
  const historyText = history
    .filter((m) => m.agenttext)
    .map((m) => `User: ${m.usertext}\nAssistant: ${m.agenttext}`)
    .join("\n\n");

  const fullPrompt = historyText
    ? `${historyText}\n\nUser: ${userText}`
    : userText;

  // Stream the AI response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";
      try {
        const result = await ai(fullPrompt, userId);

      // The @openai/agents run() with stream:true returns a StreamedRunResult
      // Use toStream() to get a ReadableStream of events
      const rawStream = result.toStream();
      const reader = (rawStream as unknown as ReadableStream).getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // value is a RunStreamEvent
        const event = value as any;
        if (event.type === "text_delta") {
          const delta = event.delta ?? "";
          if (delta) {
            fullResponse += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
            );
          }
        } else if (event.type === "raw") {
          const delta = event.data?.delta ?? "";
          if (delta) {
            fullResponse += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
            );
          }
        }
      }

        // Also check finalOutput as fallback
        if (!fullResponse && result.finalOutput) {
          fullResponse = result.finalOutput;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ delta: result.finalOutput })}\n\n`
            )
          );
        }

        // Save assistant response to DB
        if (fullResponse) {
          // Update the last message with the agent response
          const lastMsg = history[history.length - 1];
          if (lastMsg) {
            await db
              .update(chatMessages)
              .set({ agenttext: fullResponse })
              .where(eq(chatMessages.id, lastMsg.id));
          }

          // Estimate tokens (rough: 1 token ≈ 4 chars)
          const estimatedTokens = Math.ceil(
            (userText.length + fullResponse.length) / 4
          );

          // Log usage event
          
          await db.insert(aiUsageEvents).values({
            tenantId: userId,
            model: "gemma-4-31b-it",
            totalTokens: estimatedTokens,
          });

          // Increment token used in subscription
          if (sub) {
            await db
              .update(subscriptions)
              .set({
                tokenUsed: (sub.tokenUsed ?? 0) + estimatedTokens,
              })
              .where(eq(subscriptions.tenantId, userId));
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: sid })}\n\n`)
        );
        controller.close();
      } catch (err) {
        console.error("[api/chat] Stream error:", err);
        const errMsg = err instanceof Error ? err.message : "Stream failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * GET /api/chat?sessionId=...
 * Fetch messages for a session.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    // Fetch messages for a specific session
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json({ messages });
  }

  // Fetch all sessions for the tenant
  const sessions = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.tenantid, userId))
    .orderBy(desc(chatSessions.createdAt));

  return NextResponse.json({ sessions });
}
