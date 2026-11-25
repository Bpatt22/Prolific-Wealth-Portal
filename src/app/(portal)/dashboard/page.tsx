import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getCurrentTeamMember, type TeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CONSTRAINT_TYPE_OPTIONS, PIPELINE_STAGES, normalizeAffiliateName } from "@/lib/ghl/constants";
import { buildMeetings, type Meeting } from "@/lib/meetings";
import FunnelBars from "../funnel-bars";
import NewLeadButton from "../new-lead-button";

type FundingRow = { "Funding Amount": number | null; "Prolific Fee": number | null; "Invoice Status": string | null };
type ReferralRow = { "Payout Owed": number | null; "Payout Status": string | null };
type OppRow = { stage_id: string; monetary_value: number | null; status: string | null };
type ContactRow = {
  ghl_contact_id: string;
  first_name: string | null;
  last_name: string | null;
  custom_fields: Record<string, unknown> | null;
  date_updated: string | null;
};

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const LOST_STAGE_ID = PIPELINE_STAGES.find((s) => s.name === "Lost / Disqualified")?.id;
const LEAD_LIST_LIMIT = 25;
const PAST_MEETINGS_LIMIT = 25;

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "booked") return "badge badge-green";
  if (s === "cancelled" || s === "canceled") return "badge badge-red";
  return "badge badge-slate";
}

function MeetingsTable({ rows }: { rows: Meeting[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Name</th>
            <th>Closer</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id}>
              <td>
                {m.when}
                <div className="cell-sub">{m.zoneLabel}</div>
              </td>
              <td>
                <Link href={`/contacts/${m.id}`}>{m.name}</Link>
              </td>
              <td className="cell-sub">{m.closer}</td>
              <td>
                <span className={statusBadgeClass(m.status)}>{m.status || "—"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function getDashboardData(member: TeamMember, affiliateOnly: boolean, showAll: boolean) {
  let contactsQuery = supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id, first_name, last_name, custom_fields, date_updated");
  if (!member.isOwner) contactsQuery = contactsQuery.eq("owner_id", member.ghlUserId);
  const { data: myContacts, error: contactsError } = await contactsQuery.returns<ContactRow[]>();
  if (contactsError) throw contactsError;

  const contactIds = (myContacts ?? []).map((c) => c.ghl_contact_id);

  let fundingQuery = supabaseAdmin.from("Funding Ledger").select('"Funding Amount", "Prolific Fee", "Invoice Status"');
  if (!member.isOwner) fundingQuery = fundingQuery.in("GHL Contact ID", contactIds);

  let referralQuery = supabaseAdmin.from("Referral Ledger").select('"Payout Owed", "Payout Status"');
  if (!member.isOwner) referralQuery = referralQuery.in("Referral Client Contact Id", contactIds);

  // Opportunities are always filtered to this contactIds list (unlike the
  // ledger queries above, which skip filtering for owners) because it's
  // already the complete "Main"-tagged set for owners, not just "their own" —
  // scoped by the linked contact's owner, not the opportunity's own separate
  // "assigned to" field. See /api/opportunities for why.
  const oppQuery = supabaseAdmin.from("opportunities").select("stage_id, monetary_value, status").in("contact_id", contactIds);

  const recentOppsQuery = supabaseAdmin
    .from("opportunities")
    .select("ghl_opportunity_id, name, date_updated")
    .in("contact_id", contactIds)
    .order("date_updated", { ascending: false })
    .limit(6);

  const [fundingResult, referralResult, oppResult, recentOppsResult] = await Promise.all([
    !member.isOwner && contactIds.length === 0
      ? Promise.resolve({ data: [] as FundingRow[], error: null })
      : fundingQuery.returns<FundingRow[]>(),
    !member.isOwner && contactIds.length === 0
      ? Promise.resolve({ data: [] as ReferralRow[], error: null })
      : referralQuery.returns<ReferralRow[]>(),
    oppQuery.returns<OppRow[]>(),
    recentOppsQuery,
  ]);

  if (fundingResult.error) throw fundingResult.error;
  if (referralResult.error) throw referralResult.error;
  if (oppResult.error) throw oppResult.error;
  if (recentOppsResult.error) throw recentOppsResult.error;

  const fundingRows = fundingResult.data ?? [];
  const referralRows = referralResult.data ?? [];
  const oppRows = oppResult.data ?? [];
  const recentOpps = recentOppsResult.data ?? [];

  const totalFundingApproved = fundingRows.reduce((s, r) => s + Number(r["Funding Amount"] ?? 0), 0);
  const totalProlificFees = fundingRows.reduce((s, r) => s + Number(r["Prolific Fee"] ?? 0), 0);
  const dealsFunded = fundingRows.length;

  const isPaid = (status: string | null) => (status ?? "").toLowerCase().includes("paid");
  const totalPaidToReferrers = referralRows.filter((r) => isPaid(r["Payout Status"])).reduce((s, r) => s + Number(r["Payout Owed"] ?? 0), 0);
  const pendingReferralPayouts = referralRows.filter((r) => !isPaid(r["Payout Status"])).reduce((s, r) => s + Number(r["Payout Owed"] ?? 0), 0);

  const openOpps = oppRows.filter((o) => o.status === "open");
  const pipelineValue = openOpps.reduce((s, o) => s + Number(o.monetary_value ?? 0), 0);

  const stageRows = PIPELINE_STAGES.filter((s) => s.id !== LOST_STAGE_ID).map((stage) => {
    const inStage = oppRows.filter((o) => o.stage_id === stage.id);
    const value = inStage.reduce((s, o) => s + Number(o.monetary_value ?? 0), 0);
    return { label: stage.name, count: inStage.length, sublabel: `${inStage.length} deals · ${formatCurrency(value)}` };
  });

  const contacts = myContacts ?? [];
  const constraintRows = CONSTRAINT_TYPE_OPTIONS.map((option) => {
    const count = contacts.filter(
      (c) => String(c.custom_fields?.constraintType ?? "").toLowerCase() === option.toLowerCase()
    ).length;
    const pct = contacts.length ? Math.round((count / contacts.length) * 100) : 0;
    return { label: option, count, sublabel: `${count} clients · ${pct}%` };
  });

  const recentContacts = [...contacts]
    .filter((c) => c.date_updated)
    .sort((a, b) => (b.date_updated! > a.date_updated! ? 1 : -1))
    .slice(0, 6)
    .map((c) => ({
      text: `${[c.first_name, c.last_name].filter(Boolean).join(" ") || "Contact"} record updated`,
      date: c.date_updated!,
      href: `/contacts/${c.ghl_contact_id}`,
    }));

  // Owner-only. A lead is Direct when "Referred By?" is empty after
  // normalization; anything else is Affiliate, even if the value matches no
  // row in the affiliates table. String(...) guards against non-string values.
  // Counts always cover every lead; the filter and the row cap only affect
  // which rows are listed.
  let leadSources: {
    directCount: number;
    affiliateCount: number;
    rows: { id: string; name: string; referredBy: string; dateUpdated: string | null; isAffiliate: boolean }[];
    total: number;
  } | null = null;
  if (member.isOwner) {
    const leads = contacts
      .map((c) => {
        const referredBy = String(c.custom_fields?.referredBy ?? "");
        return {
          id: c.ghl_contact_id,
          name: [c.first_name, c.last_name].filter(Boolean).join(" ") || "Contact",
          referredBy,
          dateUpdated: c.date_updated,
          isAffiliate: normalizeAffiliateName(referredBy) !== "",
        };
      })
      .sort((a, b) => (b.dateUpdated ?? "").localeCompare(a.dateUpdated ?? ""));
    const affiliateCount = leads.filter((l) => l.isAffiliate).length;
    const matching = affiliateOnly ? leads.filter((l) => l.isAffiliate) : leads;
    leadSources = {
      directCount: leads.length - affiliateCount,
      affiliateCount,
      total: matching.length,
      rows: showAll ? matching : matching.slice(0, LEAD_LIST_LIMIT),
    };
  }

  // Owner-only, like leadSources: strategy-call bookings from the mirrored
  // iClosed fields. Non-owners get null, so the section never renders for them.
  const meetings = member.isOwner ? buildMeetings(contacts) : null;

  const recentActivity = [
    ...recentContacts,
    ...recentOpps
      .filter((o) => o.date_updated)
      .map((o) => ({ text: `${o.name ?? "Opportunity"} updated`, date: o.date_updated as string, href: undefined })),
  ]
    .sort((a, b) => (b.date > a.date ? 1 : -1))
    .slice(0, 6);

  return {
    kpis: {
      activeOpportunities: openOpps.length,
      pipelineValue,
      totalFundingApproved,
      dealsFunded,
      totalPaidToReferrers,
      pendingReferralPayouts,
      totalProlificFees,
    },
    stageRows,
    constraintRows,
    leadSources,
    meetings,
    recentActivity,
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const member = await getCurrentTeamMember();
  // Both parameters are only meaningful for owners; team members ignore them.
  const query = member.isOwner ? await searchParams : {};
  const affiliateOnly = query.source === "affiliate";
  const showAll = query.show === "all";
  const data = await getDashboardData(member, affiliateOnly, showAll);

  // Each link keeps the other control's parameter.
  const dashboardHref = (opts: { affiliateOnly: boolean; showAll: boolean }) => {
    const p = new URLSearchParams();
    if (opts.affiliateOnly) p.set("source", "affiliate");
    if (opts.showAll) p.set("show", "all");
    const qs = p.toString();
    return qs ? `/dashboard?${qs}` : "/dashboard";
  };

  const kpis = [
    { label: "Active Opportunities", value: String(data.kpis.activeOpportunities) },
    { label: "Pipeline Value", value: formatCurrency(data.kpis.pipelineValue) },
    { label: "Total Funding Approved", value: formatCurrency(data.kpis.totalFundingApproved) },
    { label: "Deals Funded", value: String(data.kpis.dealsFunded) },
    { label: "Total Paid to Referrers", value: formatCurrency(data.kpis.totalPaidToReferrers) },
    { label: "Pending Referral Payouts", value: formatCurrency(data.kpis.pendingReferralPayouts) },
  ];

  return (
    <section>
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className="card kpi">
            <div className="label">{k.label}</div>
            <div className="value num">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="stack">
          <div className="card card-pad">
            <div className="section-head row between">
              <div>
                <h2>Pipeline by stage</h2>
                <p>{member.isOwner ? "All" : "Your"} open deals across the Prolific Wealth Group funnel</p>
              </div>
              <Link href="/opportunities" className="btn btn-sm">
                Open pipeline →
              </Link>
            </div>
            {data.stageRows.every((r) => r.count === 0) ? (
              <div className="empty-state">
                <div className="t">No opportunities yet</div>
                <div className="d">Opportunities assigned to you will show up here.</div>
              </div>
            ) : (
              <FunnelBars rows={data.stageRows} />
            )}
          </div>

          <div className="card card-pad">
            <div className="section-head">
              <h2>Constraint diagnosis mix</h2>
              <p>Primary bottleneck across {member.isOwner ? "all" : "your"} contacts, from the Constraint Type field in GHL</p>
            </div>
            <FunnelBars rows={data.constraintRows} />
          </div>

          {data.leadSources && (
            <div className="card card-pad">
              <div className="section-head row between">
                <div>
                  <h2>Lead sources</h2>
                  <p>
                    {data.leadSources.directCount} Direct · {data.leadSources.affiliateCount} Affiliate, by the Referred By? field in GHL
                  </p>
                </div>
                {affiliateOnly ? (
                  <Link href={dashboardHref({ affiliateOnly: false, showAll })} className="btn btn-sm">
                    All leads
                  </Link>
                ) : (
                  <Link href={dashboardHref({ affiliateOnly: true, showAll })} className="btn btn-sm">
                    Affiliate only
                  </Link>
                )}
              </div>
              {data.leadSources.rows.length === 0 ? (
                <div className="empty-state">
                  <div className="t">{affiliateOnly ? "No affiliate leads" : "No leads yet"}</div>
                  <div className="d">
                    {affiliateOnly ? "No contacts have a Referred By? value." : "Contacts will show up here once they sync from GHL."}
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Referred By</th>
                          <th>Updated</th>
                          <th>Source</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.leadSources.rows.map((r) => (
                          <tr key={r.id}>
                            <td>
                              <Link href={`/contacts/${r.id}`}>{r.name}</Link>
                            </td>
                            <td className="cell-sub">{r.isAffiliate ? r.referredBy : "—"}</td>
                            <td className="cell-sub">
                              {r.dateUpdated ? formatDistanceToNow(new Date(r.dateUpdated), { addSuffix: true }) : "—"}
                            </td>
                            <td>
                              <span className={r.isAffiliate ? "badge badge-violet" : "badge badge-slate"}>
                                {r.isAffiliate ? "Affiliate" : "Direct"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="row between" style={{ marginTop: 10, fontSize: 12 }}>
                    <span>
                      Showing {data.leadSources.rows.length} of {data.leadSources.total}
                    </span>
                    {data.leadSources.total > LEAD_LIST_LIMIT &&
                      (showAll ? (
                        <Link href={dashboardHref({ affiliateOnly, showAll: false })} className="btn btn-sm">
                          Show fewer
                        </Link>
                      ) : (
                        <Link href={dashboardHref({ affiliateOnly, showAll: true })} className="btn btn-sm">
                          Show all {data.leadSources.total}
                        </Link>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          {data.meetings && (
            <div className="card card-pad">
              <div className="section-head">
                <h2>Meetings</h2>
                <p>Strategy calls booked through iClosed, shown in each lead&apos;s timezone</p>
              </div>
              <div className="section-head" style={{ marginTop: 4 }}>
                <h2 style={{ fontSize: 13 }}>Upcoming ({data.meetings.upcoming.length})</h2>
              </div>
              {data.meetings.upcoming.length === 0 ? (
                <div className="empty-state">
                  <div className="t">No upcoming calls</div>
                </div>
              ) : (
                <MeetingsTable rows={data.meetings.upcoming} />
              )}
              <div className="section-head" style={{ marginTop: 16 }}>
                <h2 style={{ fontSize: 13 }}>Past ({data.meetings.past.length})</h2>
              </div>
              {data.meetings.past.length === 0 ? (
                <div className="empty-state">
                  <div className="t">No past calls</div>
                </div>
              ) : (
                <>
                  <MeetingsTable rows={data.meetings.past.slice(0, PAST_MEETINGS_LIMIT)} />
                  {data.meetings.past.length > PAST_MEETINGS_LIMIT && (
                    <div style={{ marginTop: 10, fontSize: 12 }}>
                      Showing the {PAST_MEETINGS_LIMIT} most recent of {data.meetings.past.length}
                    </div>
                  )}
                </>
              )}
              {data.meetings.unreadable > 0 && (
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  {data.meetings.unreadable} booking{data.meetings.unreadable === 1 ? "" : "s"} with an unreadable call time not shown.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card card-pad">
            <div className="section-head">
              <h2>Quick actions</h2>
            </div>
            <div className="stack" style={{ gap: 9 }}>
              <NewLeadButton className="btn btn-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New client / lead
              </NewLeadButton>
              <Link href="/opportunities" className="btn" style={{ justifyContent: "flex-start" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5h18M6 12h12M10 19h4" />
                </svg>
                View pipeline
              </Link>
              <Link href="/clients" className="btn" style={{ justifyContent: "flex-start" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="8" r="3.2" />
                  <path d="M2.5 20c1-3.8 3.6-5.8 6.5-5.8s5.5 2 6.5 5.8" />
                  <circle cx="18" cy="8.5" r="2.3" />
                  <path d="M16 14.3c2.5.4 4.2 2.1 5 5.3" />
                </svg>
                View clients
              </Link>
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-head">
              <h2>Recent activity</h2>
            </div>
            {data.recentActivity.length === 0 ? (
              <div className="empty-state">
                <div className="t">Nothing yet</div>
                <div className="d">Updates to your contacts and opportunities will show up here.</div>
              </div>
            ) : (
              <div>
                {data.recentActivity.map((a, i) => {
                  const inner = (
                    <div className="activity-item" key={i}>
                      <div className="activity-dot" />
                      <div>
                        <div className="txt">{a.text}</div>
                        <div className="ts">{formatDistanceToNow(new Date(a.date), { addSuffix: true })}</div>
                      </div>
                    </div>
                  );
                  return a.href ? (
                    <Link key={i} href={a.href} style={{ textDecoration: "none", color: "inherit" }}>
                      {inner}
                    </Link>
                  ) : (
                    inner
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
