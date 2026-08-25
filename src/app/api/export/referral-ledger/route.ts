import { NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getScopedContactIds } from "@/lib/scopedContacts";
import { toCsv } from "@/lib/csv";

const COLUMNS = ["Referrer Name", "Referred Client", "Success Fee", "Payout Owed", "Payout Status"];

export async function GET() {
  const member = await getCurrentTeamMember();
  const contactIds = await getScopedContactIds(member);

  if (contactIds?.length === 0) {
    return new NextResponse(toCsv([], COLUMNS), {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=referral-ledger.csv" },
    });
  }

  let query = supabaseAdmin.from("Referral Ledger").select(COLUMNS.map((c) => `"${c}"`).join(","));
  if (contactIds) query = query.in("Referral Client Contact Id", contactIds);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = toCsv((data ?? []) as unknown as Record<string, unknown>[], COLUMNS);
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=referral-ledger.csv" },
  });
}
