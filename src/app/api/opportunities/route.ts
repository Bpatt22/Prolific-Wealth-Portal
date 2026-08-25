import { NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Returns this user's opportunities (owner-scoped to their GHL user id, or
// every opportunity if they're an owner), read from the mirror table so the
// board loads instantly.
export async function GET() {
  const member = await getCurrentTeamMember();

  let query = supabaseAdmin
    .from("opportunities")
    .select(
      "ghl_opportunity_id, contact_id, stage_id, name, monetary_value, status, date_updated, contacts(first_name, last_name, email, phone)"
    )
    .order("date_updated", { ascending: false });

  if (!member.isOwner) query = query.eq("owner_id", member.ghlUserId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ opportunities: data });
}
