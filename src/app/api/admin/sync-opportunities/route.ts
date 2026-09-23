import { NextRequest, NextResponse } from "next/server";
import { listAllOpportunities } from "@/lib/ghl/opportunities";
import { upsertOpportunitiesMirrorBatch } from "@/lib/sync";

// Lightweight companion to /api/admin/backfill — syncs only opportunities,
// not the full ~500+ contact list. Contacts already sync in real time via
// the GHL Workflow webhook, so this is what the every-minute pg_cron job
// actually needs to stay fast: opportunity stage changes made directly in
// GHL are the one thing with no webhook coverage.
// Call with: POST /api/admin/sync-opportunities?secret=<ADMIN_BACKFILL_SECRET>
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
    const message = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
