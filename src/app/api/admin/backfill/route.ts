import { NextRequest, NextResponse } from "next/server";
import { listAllContacts } from "@/lib/ghl/contacts";
import { listAllOpportunities } from "@/lib/ghl/opportunities";
import { upsertContactsMirrorBatch, upsertOpportunitiesMirrorBatch } from "@/lib/sync";

// One-time (or re-runnable) full sync from GHL into the Supabase mirror tables.
// Call with: POST /api/admin/backfill?secret=<ADMIN_BACKFILL_SECRET>
// Safe to re-run any time — it's a full upsert, not additive.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_BACKFILL_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contacts = await listAllContacts();
  await upsertContactsMirrorBatch(contacts);

  const opportunities = await listAllOpportunities();
  await upsertOpportunitiesMirrorBatch(opportunities);

  return NextResponse.json({
    ok: true,
    contactsSynced: contacts.length,
    opportunitiesSynced: opportunities.length,
  });
}
