import { NextRequest, NextResponse } from "next/server";
import { getContact } from "@/lib/ghl/contacts";
import { upsertContactMirror, deleteContactMirror } from "@/lib/sync";

// Point a GHL Workflow's Webhook action here:
//   https://<your-domain>/api/webhooks/ghl/contact?secret=<GHL_WEBHOOK_SECRET>
// Trigger it on "Contact Changed" (create/update/tag/custom-field change).
// We only need the contact id in the payload — we re-fetch the full record
// from the API so the mirror is always accurate regardless of what fields
// the workflow happened to include.
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.GHL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const contactId =
    (body.contact_id as string) ||
    (body.contactId as string) ||
    (body.id as string) ||
    ((body.contact as Record<string, unknown> | undefined)?.id as string) ||
    undefined;

  if (!contactId) {
    return NextResponse.json({ error: "no contact id in payload" }, { status: 400 });
  }

  if (body.type === "ContactDelete" || body.eventType === "ContactDelete") {
    await deleteContactMirror(contactId);
    return NextResponse.json({ ok: true, deleted: contactId });
  }

  try {
    const contact = await getContact(contactId);
    await upsertContactMirror(contact);
    return NextResponse.json({ ok: true, contactId });
  } catch (err) {
    // Contact may have been deleted between the event firing and this fetch.
    await deleteContactMirror(contactId).catch(() => {});
    return NextResponse.json({ ok: true, note: "contact not found, removed from mirror", err: String(err) });
  }
}
