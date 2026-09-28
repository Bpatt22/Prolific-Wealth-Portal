import { NextRequest, NextResponse } from "next/server";
import { listAllContacts } from "@/lib/ghl/contacts";
import { listAllOpportunities } from "@/lib/ghl/opportunities";
import { fetchCustomFieldNameMap } from "@/lib/ghl/customFields";
import { backupAllContacts, backupAllOpportunities } from "@/lib/ghlBackup";
import { serializeError } from "@/lib/serializeError";

// Fully separate from the portal's own live sync (/api/admin/backfill,
// /api/admin/sync-opportunities) — writes only to ghl_backup_* tables, which
// the portal never reads. Backs up EVERY contact/opportunity (no "Main" tag
// filter) with all custom fields, soft-deleting anything GHL no longer has.
// Call with: POST /api/backup/contacts-opportunities?secret=<ADMIN_BACKFILL_SECRET>
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.ADMIN_BACKFILL_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const nameMap = await fetchCustomFieldNameMap();

    const contacts = await listAllContacts();
    const contactsResult = await backupAllContacts(contacts, nameMap);

    const opportunities = await listAllOpportunities();
    const opportunitiesResult = await backupAllOpportunities(opportunities);

    return NextResponse.json({
      ok: true,
      contactsBackedUp: contactsResult.synced,
      opportunitiesBackedUp: opportunitiesResult.synced,
    });
  } catch (err) {
    console.error("backup contacts-opportunities failed", err);
    return NextResponse.json({ error: serializeError(err) }, { status: 500 });
  }
}
