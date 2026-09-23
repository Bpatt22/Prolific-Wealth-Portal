import { NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getVisibleContactIds } from "@/lib/scopedContacts";

type ContactSummary = { first_name: string | null; last_name: string | null; email: string | null; phone: string | null };

// Returns this user's opportunities, read from the mirror table so the board
// loads instantly. Scoped by the linked contact's GHL owner — not the
// opportunity's own separate "assigned to" field, since GHL tracks those
// independently and a contact being assigned to someone doesn't also assign
// their opportunities. Always filtered to "Main"-tagged contacts, including
// for owners — the contacts mirror only ever holds those, so this also
// excludes any opportunity whose contact isn't tagged "Main".
//
// Joined manually (two queries, merged here) rather than via a PostgREST
// embedded `contacts(...)` select — that requires an actual foreign key
// constraint between the tables, which opportunities.contact_id
// deliberately doesn't have (a non-"Main" contact's opportunity has to be
// insertable with a "dangling" contact_id that simply won't match anything).
export async function GET() {
  const member = await getCurrentTeamMember();
  const contactIds = await getVisibleContactIds(member);

  if (contactIds.length === 0) {
    return NextResponse.json({ opportunities: [] });
  }

  const [oppResult, contactResult] = await Promise.all([
    supabaseAdmin
      .from("opportunities")
      .select("ghl_opportunity_id, contact_id, stage_id, name, monetary_value, status, date_updated")
      .in("contact_id", contactIds)
      .order("date_updated", { ascending: false }),
    supabaseAdmin.from("contacts").select("ghl_contact_id, first_name, last_name, email, phone").in("ghl_contact_id", contactIds),
  ]);

  if (oppResult.error) return NextResponse.json({ error: oppResult.error.message }, { status: 500 });
  if (contactResult.error) return NextResponse.json({ error: contactResult.error.message }, { status: 500 });

  const contactsById = new Map<string, ContactSummary>(
    (contactResult.data ?? []).map((c) => [
      c.ghl_contact_id,
      { first_name: c.first_name, last_name: c.last_name, email: c.email, phone: c.phone },
    ])
  );

  const opportunities = (oppResult.data ?? []).map((o) => ({
    ...o,
    contacts: o.contact_id ? (contactsById.get(o.contact_id) ?? null) : null,
  }));

  return NextResponse.json({ opportunities });
}
