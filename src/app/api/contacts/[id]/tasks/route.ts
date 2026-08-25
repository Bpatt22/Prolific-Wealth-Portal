import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { createTask, getContact } from "@/lib/ghl/contacts";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentTeamMember();

  const contact = await getContact(id).catch(() => null);
  if (!contact) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (contact.assignedTo !== member.ghlUserId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { title, dueDate } = (await req.json()) as { title?: string; dueDate?: string };
  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });

  const task = await createTask(id, {
    title: title.trim(),
    dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
    assignedTo: member.ghlUserId,
  });

  return NextResponse.json({ ok: true, task });
}
