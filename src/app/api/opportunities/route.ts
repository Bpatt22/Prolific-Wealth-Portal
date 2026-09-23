import { NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getVisibleContactIds } from "@/lib/scopedContacts";

// Returns this user's opportunities, read from the mirror table so the board
// loads instantly. Scoped by the linked contact's GHL owner — not the
// opportunity's own separate "assigned to" field, since GHL tracks those
// independently and a contact being assigned to someone doesn't also assign
// their opportunities. Always filtered to "Main"-tagged contacts, including
// for owners — the contacts mirror only ever holds those, so this also
// excludes any opportunity whose contact isn't tagged "Main".
export async function GET() {
  const member = await getCurrentTeamMember();
  const contactIds = await getVisibleContactIds(member);

  if (contactIds.length === 0) {
    return NextResponse.json({ opportunities: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("opportunities")
    .select(
      "ghl_opportunity_id, contact_id, stage_id, name, monetary_value, status, date_updated, contacts(first_name, last_name, email, phone)"
    )
    .in("contact_id", contactIds)
    .order("date_updated", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ opportunities: data });
}
