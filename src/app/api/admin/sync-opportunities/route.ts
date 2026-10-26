import { NextRequest, NextResponse } from "next/server";
import { listAllOpportunities } from "@/lib/ghl/opportunities";
import { upsertOpportunitiesMirrorBatch } from "@/lib/sync";
import { serializeError } from "@/lib/serializeError";

// Lightweight companion to /api/admin/backfill — syncs only opportunities,
// not the full ~500+ contact list. Contacts already sync in real time via
// the GHL Workflow webhook; this periodic reconciliation is what actually
// removes an opportunity from the mirror when it's deleted in GHL (there's
// no reliable "OpportunityDelete" workflow trigger to depend on).
// Call with: POST /api/admin/sync-opportunities?secret=<ADMIN_BACKFILL_SECRET>
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_BACKFILL_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const opportunities = await listAllOpportunities();
    await upsertOpportunitiesMirrorBatch(opportunities);
    return NextResponse.json({ ok: true, opportunitiesSynced: opportunities.length });
  } catch (err) {
    console.error("sync-opportunities failed", err);
    return NextResponse.json({ error: serializeError(err) }, { status: 500 });
  }
}
