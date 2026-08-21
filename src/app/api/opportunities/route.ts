import { NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Returns this user's opportunities (owner-scoped to their GHL user id),
// read from the mirror table so the board loads instantly.
export async function GET() {
  const member = await getCurrentTeamMember();

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select(
      "ghl_opportunity_id, contact_id, stage_id, name, monetary_value, status, date_updated, contacts(first_name, last_name, email, phone)"
    )
    .eq("owner_id", member.ghlUserId)
    .order("date_updated", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ opportunities: data });
}
