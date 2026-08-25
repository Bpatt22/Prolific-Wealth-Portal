import { NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { toCsv } from "@/lib/csv";

const COLUMNS = ["Referrer Name", "Referred Client", "Success Fee", "Payout Owed", "Payout Status"];

export async function GET() {
  const member = await getCurrentTeamMember();

  const { data: myContacts, error: contactsError } = await supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id")
    .eq("owner_id", member.ghlUserId);
  if (contactsError) return NextResponse.json({ error: contactsError.message }, { status: 500 });

  const contactIds = (myContacts ?? []).map((c) => c.ghl_contact_id);
  if (contactIds.length === 0) {
    return new NextResponse(toCsv([], COLUMNS), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=referral-ledger.csv" },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("Referral Ledger")
    .select(COLUMNS.map((c) => `"${c}"`).join(",") + ',"Referral Client Contact Id"')
    .in("Referral Client Contact Id", contactIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = toCsv((data ?? []) as unknown as Record<string, unknown>[], COLUMNS);
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=referral-ledger.csv" },
  });
}
