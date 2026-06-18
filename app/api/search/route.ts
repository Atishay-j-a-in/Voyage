import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { search } from "@/lib/search";

/**
 * GET /api/search?q=...&limit=20
 *
 * Hybrid email search: semantic vector + keyword, ranked and deduplicated.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    console.log(`[api/search] Query: "${query}", Tenant: ${userId}`);

    const results = await search({
      tenantId: userId,
      query,
      limit,
    });

    console.log(`[api/search] Found ${results.length} results`);
    return NextResponse.json({
      results,
      total: results.length,
      query,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[api/search] Failed:", message, error);
    return NextResponse.json(
      { error: message, results: [], total: 0 },
      { status: 500 }
    );
  }
}
