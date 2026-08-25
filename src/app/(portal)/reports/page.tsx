import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getScopedContactIds } from "@/lib/scopedContacts";
import { PIPELINE_STAGES } from "@/lib/ghl/constants";
import FunnelBars from "../funnel-bars";

type FundingRow = { "Funding Amount": number | null; "Approval Date": string | null };
type OppRow = { stage_id: string; monetary_value: number | null };

function fmtMoney(n: number) {
  return "$" + Number(n).toLocaleString("en-US");
}

const LOST_STAGE_ID = PIPELINE_STAGES.find((s) => s.name === "Lost / Disqualified")?.id;

export default async function ReportsPage() {
  const member = await getCurrentTeamMember();

  const contactIds = await getScopedContactIds(member);

  let fundingRows: FundingRow[] = [];
  if (contactIds === null || contactIds.length > 0) {
    let fundingQuery = supabaseAdmin.from("Funding Ledger").select('"Funding Amount", "Approval Date"');
    if (contactIds) fundingQuery = fundingQuery.in("GHL Contact ID", contactIds);
    const { data, error } = await fundingQuery.returns<FundingRow[]>();
    if (error) throw error;
    fundingRows = data ?? [];
  }

  let oppQuery = supabaseAdmin.from("opportunities").select("stage_id, monetary_value");
  if (!member.isOwner) oppQuery = oppQuery.eq("owner_id", member.ghlUserId);
  const { data: oppRows, error: oppError } = await oppQuery.returns<OppRow[]>();
  if (oppError) throw oppError;

  const byMonth = new Map<string, number>();
  for (const r of fundingRows) {
    if (!r["Approval Date"]) continue;
    const d = new Date(r["Approval Date"]);
    if (Number.isNaN(d.getTime())) continue;
    const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(r["Funding Amount"] ?? 0));
  }
  const monthRows = Array.from(byMonth.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([month, amount]) => ({ label: month, count: amount, sublabel: fmtMoney(amount) }));

  const stageRows = PIPELINE_STAGES.filter((s) => s.id !== LOST_STAGE_ID).map((stage) => {
    const inStage = (oppRows ?? []).filter((o) => o.stage_id === stage.id);
    const value = inStage.reduce((s, o) => s + Number(o.monetary_value ?? 0), 0);
    return { label: stage.name, count: inStage.length, sublabel: `${inStage.length} deals · ${fmtMoney(value)}` };
  });

  return (
    <section>
      <div className="section-head">
        <h2>Reports</h2>
        <p>Live from your funded deals and pipeline</p>
      </div>

      <div className="stack">
        <div className="card card-pad">
          <div className="section-head">
            <h2>Funding placed by month</h2>
            <p>From Funding Ledger, grouped by approval date</p>
          </div>
          {monthRows.length === 0 ? (
            <div className="empty-state">
              <div className="t">No funded deals yet</div>
            </div>
          ) : (
            <FunnelBars rows={monthRows} />
          )}
        </div>

        <div className="card card-pad">
          <div className="section-head">
            <h2>Pipeline by stage</h2>
            <p>Your open and closed opportunities in the Prolific Wealth Group pipeline</p>
          </div>
          <FunnelBars rows={stageRows} />
        </div>
      </div>
    </section>
  );
}
