import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/server/corsair";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
  allDay: boolean;
}

/**
 * GET /api/calendar/events?from=...&to=...
 *
 * Fetches real events from the Google Calendar via Corsair DB.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  try {
    const tenant = corsair.withTenant(userId);
    const entities = await tenant.googlecalendar.db.events.search({ limit: 250 });

    const events: CalendarEvent[] = [];

    for (const entity of entities) {
      const data = entity.data as any;
      const start = data?.start?.dateTime ?? data?.start?.date;
      const end = data?.end?.dateTime ?? data?.end?.date;
      if (!start || !end) continue;

      // Filter by date range if provided
      if (from && start < from) continue;
      if (to && end > to) continue;

      events.push({
        id: entity.entity_id ?? entity.id ?? Math.random().toString(36).slice(2),
        title: data.summary ?? "(No title)",
        start,
        end,
        allDay: !!data.start?.date,
      });
    }

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/calendar/events] Failed:", message);
    return NextResponse.json({ events: [], error: message }, { status: 500 });
  }
}

/**
 * POST /api/calendar/events
 *
 * Creates a new calendar event via the Google Calendar API using corsair.
 * Body: { summary: string, start: string, end: string }
 */
export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { summary, start, end } = (await req.json()) as {
      summary: string;
      start: string; // ISO datetime
      end: string;   // ISO datetime
    };

    if (!summary || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields: summary, start, end" },
        { status: 400 },
      );
    }

    const tenant = corsair.withTenant(userId);

    const result = await (tenant.googlecalendar.api.events as any).insert({
      summary,
      start: { dateTime: start, timeZone: "Asia/Kolkata" },
      end: { dateTime: end, timeZone: "Asia/Kolkata" },
    });

    console.log("[api/calendar/events] Event created:", result);

    return NextResponse.json({ success: true, eventId: result?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/calendar/events] POST Failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
