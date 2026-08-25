import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ReferralRow = {
  "Referrer Name": string | null;
  "Referred Client": string | null;
  "Success Fee": number | null;
  "Payout Owed": number | null;
  "Payout Status": string | null;
};

function fmtMoney(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const isPaid = (status: string | null) => (status ?? "").toLowerCase().includes("paid");

export default async function PartnersPage() {
  const member = await getCurrentTeamMember();

  const { data: myContacts } = await supabaseAdmin.from("contacts").select("ghl_contact_id").eq("owner_id", member.ghlUserId);
  const contactIds = (myContacts ?? []).map((c) => c.ghl_contact_id);

  let rows: ReferralRow[] = [];
  if (contactIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("Referral Ledger")
      .select('"Referrer Name", "Referred Client", "Success Fee", "Payout Owed", "Payout Status"')
      .in("Referral Client Contact Id", contactIds)
      .returns<ReferralRow[]>();
    if (error) throw error;
    rows = data ?? [];
  }

  const byReferrer = new Map<
    string,
    { referrer: string; referrals: number; successFees: number; owed: number; paid: number }
  >();
  for (const r of rows) {
    const name = r["Referrer Name"] ?? "Unknown";
    const entry = byReferrer.get(name) ?? { referrer: name, referrals: 0, successFees: 0, owed: 0, paid: 0 };
    entry.referrals += 1;
    entry.successFees += Number(r["Success Fee"] ?? 0);
    if (isPaid(r["Payout Status"])) entry.paid += Number(r["Payout Owed"] ?? 0);
    else entry.owed += Number(r["Payout Owed"] ?? 0);
    byReferrer.set(name, entry);
  }
  const partners = Array.from(byReferrer.values()).sort((a, b) => b.referrals - a.referrals);

  const totalOwed = partners.reduce((s, p) => s + p.owed, 0);
  const totalPaid = partners.reduce((s, p) => s + p.paid, 0);
  const totalReferrals = partners.reduce((s, p) => s + p.referrals, 0);

  return (
    <section>
      <div className="section-head">
        <h2>Referral Partners</h2>
        <p>Live rollup from Referral Ledger, for referrals into your clients — read-only</p>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card kpi">
          <div className="label">Referrals</div>
          <div className="value num">{totalReferrals}</div>
        </div>
        <div className="card kpi">
          <div className="label">Payouts Owed</div>
          <div className="value num">{fmtMoney(totalOwed)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Payouts Paid</div>
          <div className="value num">{fmtMoney(totalPaid)}</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Referrals</th>
              <th>Success fees</th>
              <th>Owed</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.referrer}>
                <td className="cell-primary">{p.referrer}</td>
                <td className="num">{p.referrals}</td>
                <td className="num">{fmtMoney(p.successFees)}</td>
                <td className="num">{fmtMoney(p.owed)}</td>
                <td className="num">{fmtMoney(p.paid)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {partners.length === 0 && (
        <div className="empty-state">
          <div className="t">No referrals yet</div>
          <div className="d">Referral payouts tied to your clients will show up here automatically.</div>
        </div>
      )}
    </section>
  );
}
