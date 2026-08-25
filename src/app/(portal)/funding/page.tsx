import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import FundingTable from "./funding-table";

type ContactRow = { ghl_contact_id: string; first_name: string | null; last_name: string | null };
type FundingRow = {
  "Client Name": string | null;
  "Funding Amount": number | null;
  "Approval Date": string | null;
  "Prolific Fee": number | null;
  "Invoice Status": string | null;
  "Invoice URL": string | null;
  "Referred by": string | null;
  "GHL Contact ID": string | null;
};

export default async function FundingPage() {
  const member = await getCurrentTeamMember();

  const { data: myContacts } = await supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id, first_name, last_name")
    .eq("owner_id", member.ghlUserId)
    .returns<ContactRow[]>();

  const contactIds = (myContacts ?? []).map((c) => c.ghl_contact_id);

  let rows: FundingRow[] = [];
  if (contactIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("Funding Ledger")
      .select('"Client Name", "Funding Amount", "Approval Date", "Prolific Fee", "Invoice Status", "Invoice URL", "Referred by", "GHL Contact ID"')
      .in("GHL Contact ID", contactIds)
      .returns<FundingRow[]>();
    if (error) throw error;
    rows = data ?? [];
  }

  return (
    <section>
      <div className="section-head">
        <h2>Funding Tracker</h2>
        <p>Live from Funding Ledger — read-only, populated by your existing automation</p>
      </div>
      <FundingTable rows={rows} />
    </section>
  );
}
