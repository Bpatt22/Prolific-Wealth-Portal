import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { getContact, listAppointments, listNotes, listTasks, updateContactFields } from "@/lib/ghl/contacts";
import { upsertContactMirror } from "@/lib/sync";
import { EDITABLE_FIELD_IDS, canAccessContact } from "@/lib/ghl/constants";
import { mapCustomFieldsToPortalKeys } from "@/lib/ghl/mapCustomFields";

// Live view of a single contact: full GHL fields, tags, notes, and appointments —
// mirroring exactly what the team would see in GHL itself. We fetch live (not
// from the mirror) so this page is always accurate down to the second.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentTeamMember();

  const contact = await getContact(id).catch(() => null);
  if (!contact) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!canAccessContact(contact, member)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const [notes, appointments, tasks] = await Promise.all([
    listNotes(id).catch(() => []),
    listAppointments(id).catch(() => []),
    listTasks(id).catch(() => []),
  ]);

  return NextResponse.json({
    contact,
    portalFields: mapCustomFieldsToPortalKeys(contact.customFields),
    notes,
    appointments,
    tasks,
  });
}

// Writes only the three portal-editable fields (Funding Approved, Funding
// Amount, Amount paid to Referrer) straight through to GHL, then refreshes
// the mirror cache. Any other field id is rejected.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentTeamMember();

  const existing = await getContact(id).catch(() => null);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!canAccessContact(existing, member)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { fields?: { id: string; value: unknown }[] };
  const fields = body.fields ?? [];

  for (const f of fields) {
    if (!EDITABLE_FIELD_IDS.has(f.id)) {
      return NextResponse.json({ error: `field ${f.id} is not editable from the portal` }, { status: 400 });
    }
  }

  const { contact } = await updateContactFields(id, { customFields: fields });
  await upsertContactMirror(contact);

  return NextResponse.json({ ok: true, contact, portalFields: mapCustomFieldsToPortalKeys(contact.customFields) });
}
