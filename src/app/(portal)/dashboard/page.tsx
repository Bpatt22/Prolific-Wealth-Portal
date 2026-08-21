import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type FundingRow = {
  "Funding Amount": number | null;
  "Prolific Fee": number | null;
  "Invoice Status": string | null;
};

type ReferralRow = {
  "Payout Owed": number | null;
  "Payout Status": string | null;
};

function formatCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

async function getDashboardStats(ghlUserId: string) {
  const { data: myContacts, error: contactsError } = await supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id")
    .eq("owner_id", ghlUserId);

  if (contactsError) throw contactsError;

  const contactIds = (myContacts ?? []).map((c) => c.ghl_contact_id);

  if (contactIds.length === 0) {
    return {
      totalFundingApproved: 0,
      dealsFunded: 0,
      totalProlificFees: 0,
      totalPaidToReferrers: 0,
      pendingReferralPayouts: 0,
    };
  }

  const [{ data: fundingRows, error: fundingError }, { data: referralRows, error: referralError }] =
    await Promise.all([
      supabaseAdmin
        .from("Funding Ledger")
        .select('"Funding Amount", "Prolific Fee", "Invoice Status"')
        .in("GHL Contact ID", contactIds)
        .returns<FundingRow[]>(),
      supabaseAdmin
        .from("Referral Ledger")
        .select('"Payout Owed", "Payout Status"')
        .in("Referral Client Contact Id", contactIds)
        .returns<ReferralRow[]>(),
    ]);

  if (fundingError) throw fundingError;
  if (referralError) throw referralError;

  const totalFundingApproved = (fundingRows ?? []).reduce((sum, r) => sum + Number(r["Funding Amount"] ?? 0), 0);
  const totalProlificFees = (fundingRows ?? []).reduce((sum, r) => sum + Number(r["Prolific Fee"] ?? 0), 0);
  const dealsFunded = (fundingRows ?? []).length;

  const isPaid = (status: string | null) => (status ?? "").toLowerCase().includes("paid");
  const totalPaidToReferrers = (referralRows ?? [])
    .filter((r) => isPaid(r["Payout Status"]))
    .reduce((sum, r) => sum + Number(r["Payout Owed"] ?? 0), 0);
  const pendingReferralPayouts = (referralRows ?? [])
    .filter((r) => !isPaid(r["Payout Status"]))
    .reduce((sum, r) => sum + Number(r["Payout Owed"] ?? 0), 0);

  return { totalFundingApproved, dealsFunded, totalProlificFees, totalPaidToReferrers, pendingReferralPayouts };
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const member = await getCurrentTeamMember();
  const stats = await getDashboardStats(member.ghlUserId);

  return (
    <div>
      <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Showing totals for contacts assigned to you in GHL.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Funding Approved" value={formatCurrency(stats.totalFundingApproved)} />
        <StatCard label="Deals Funded" value={String(stats.dealsFunded)} />
        <StatCard label="Total Paid to Referrers" value={formatCurrency(stats.totalPaidToReferrers)} />
        <StatCard label="Pending Referral Payouts" value={formatCurrency(stats.pendingReferralPayouts)} />
        <StatCard label="Total Prolific Fees" value={formatCurrency(stats.totalProlificFees)} />
      </div>
    </div>
  );
}
