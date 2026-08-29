import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { updateOpportunityStage } from "@/lib/ghl/opportunities";
import { upsertOpportunityMirror } from "@/lib/sync";
import { PIPELINE_STAGES } from "@/lib/ghl/constants";

// Moving a card on the portal's kanban board writes straight through to GHL,
// then refreshes the mirror row so every viewer's board stays consistent.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentTeamMember();
  const { stageId } = (await req.json()) as { stageId?: string };

  if (!stageId || !PIPELINE_STAGES.some((s) => s.id === stageId)) {
    return NextResponse.json({ error: "invalid stageId" }, { status: 400 });
  }

  // Ownership follows the linked contact's GHL owner, not the opportunity's
  // own separate "assigned to" field — see /api/opportunities for why.
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("opportunities")
    .select("contact_id, contacts(owner_id)")
    .eq("ghl_opportunity_id", id)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  const contactRow = existing?.contacts as unknown as { owner_id: string | null } | { owner_id: string | null }[] | null;
  const ownerId = Array.isArray(contactRow) ? contactRow[0]?.owner_id : contactRow?.owner_id;
  if (!existing || (!member.isOwner && ownerId !== member.ghlUserId)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const updated = await updateOpportunityStage(id, stageId);
  await upsertOpportunityMirror(updated);

  return NextResponse.json({ ok: true, opportunity: updated });
}
