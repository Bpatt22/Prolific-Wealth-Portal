import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyAffiliateRemoved } from "@/lib/n8n";

// Owner-only: deletes the affiliate's portal login (cascades the affiliates
// row, via its auth_user_id FK on delete cascade) and tells n8n to remove
// the matching Data Table row. Owners can't edit an affiliate once added —
// only remove and re-add.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getCurrentTeamMember();
  if (!member.isOwner) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: affiliate, error: fetchError } = await supabaseAdmin
    .from("affiliates")
    .select("auth_user_id, name, email")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!affiliate) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(affiliate.auth_user_id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await notifyAffiliateRemoved({ name: affiliate.name, email: affiliate.email });

  return NextResponse.json({ ok: true });
}
