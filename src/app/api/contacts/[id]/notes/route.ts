import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { createNote, getContact } from "@/lib/ghl/contacts";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentTeamMember();

  const contact = await getContact(id).catch(() => null);
  if (!contact) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (contact.assignedTo !== member.ghlUserId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { body } = (await req.json()) as { body?: string };
  if (!body?.trim()) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const note = await createNote(id, body.trim());
  return NextResponse.json({ ok: true, note });
}
