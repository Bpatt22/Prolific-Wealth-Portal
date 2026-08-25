import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { getContact, updateTask } from "@/lib/ghl/contacts";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const member = await getCurrentTeamMember();

  const contact = await getContact(id).catch(() => null);
  if (!contact) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!member.isOwner && contact.assignedTo !== member.ghlUserId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { completed } = (await req.json()) as { completed?: boolean };
  const task = await updateTask(id, taskId, { completed });

  return NextResponse.json({ ok: true, task });
}
