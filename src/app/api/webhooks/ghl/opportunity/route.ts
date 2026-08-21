import { NextRequest, NextResponse } from "next/server";
import { getOpportunity } from "@/lib/ghl/opportunities";
import { upsertOpportunityMirror, deleteOpportunityMirror } from "@/lib/sync";

// Point a GHL Workflow's Webhook action here:
//   https://<your-domain>/api/webhooks/ghl/opportunity?secret=<GHL_WEBHOOK_SECRET>
// Trigger it on "Opportunity Status Changed" / "Pipeline Stage Changed" / "Opportunity Created".
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const opportunityId =
    (body.opportunity_id as string) ||
    (body.opportunityId as string) ||
    (body.id as string) ||
    ((body.opportunity as Record<string, unknown> | undefined)?.id as string) ||
    undefined;

  if (!opportunityId) {
    return NextResponse.json({ error: "no opportunity id in payload" }, { status: 400 });
  }

  if (body.type === "OpportunityDelete" || body.eventType === "OpportunityDelete") {
    await deleteOpportunityMirror(opportunityId);
    return NextResponse.json({ ok: true, deleted: opportunityId });
  }

  try {
    const opp = await getOpportunity(opportunityId);
    await upsertOpportunityMirror(opp);
    return NextResponse.json({ ok: true, opportunityId });
  } catch (err) {
    await deleteOpportunityMirror(opportunityId).catch(() => {});
    return NextResponse.json({ ok: true, note: "opportunity not found, removed from mirror", err: String(err) });
  }
}
