import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { contactAlias } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/contacts
 * List all contacts for the current tenant.
 */
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(contactAlias)
    .where(eq(contactAlias.tenantid, userId));

  return NextResponse.json({ contacts: rows });
}

/**
 * POST /api/contacts
 * Add a new contact. Body: { name: string, email: string }
 */
export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name?.trim();
  const email = body.email?.trim();

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  try {
    const [row] = await db
      .insert(contactAlias)
      .values({
        name,
        emailid: email,
        tenantid: userId,
      })
      .returning();

    return NextResponse.json({ contact: row });
  } catch (err: any) {
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Contact with this name already exists" },
        { status: 409 }
      );
    }
    throw err;
  }
}

/**
 * DELETE /api/contacts?id=...
 * Delete a contact by id.
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db
    .delete(contactAlias)
    .where(and(eq(contactAlias.id, id), eq(contactAlias.tenantid, userId)));

  return NextResponse.json({ ok: true });
}
