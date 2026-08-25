import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getScopedContactIds } from "@/lib/scopedContacts";
import FundingTable from "./funding-table";

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
  const contactIds = await getScopedContactIds(member);

  let query = supabaseAdmin
    .from("Funding Ledger")
    .select('"Client Name", "Funding Amount", "Approval Date", "Prolific Fee", "Invoice Status", "Invoice URL", "Referred by", "GHL Contact ID"');
  if (contactIds) query = query.in("GHL Contact ID", contactIds);

  const { data, error } = contactIds?.length === 0 ? { data: [] as FundingRow[], error: null } : await query.returns<FundingRow[]>();
  if (error) throw error;
  const rows = data ?? [];

  return (
    <section>
      <div className="section-head">
        <h2>Funding Tracker</h2>
        <p>
          Live from Funding Ledger — read-only, populated by your existing automation
          {member.isOwner ? " · showing all clients" : ""}
        </p>
      </div>
      <FundingTable rows={rows} />
    </section>
  );
}
