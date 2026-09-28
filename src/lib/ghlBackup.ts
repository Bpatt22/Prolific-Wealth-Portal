import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { GhlContact, GhlOpportunity, GhlNote, GhlTask, GhlAppointment } from "./ghl/types";

const BATCH_SIZE = 200;

// Full custom-field set, keyed by human-readable name (not just the ~17
// curated portal fields) — this is what "back up every custom field,
// including score/constraint/funding" actually means.
export function mapAllCustomFields(
  customFields: { id: string; value: unknown }[] | undefined,
  nameMap: Map<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const cf of customFields ?? []) {
    const name = nameMap.get(cf.id) ?? cf.id;
    out[name] = cf.value;
  }
  return out;
}

function contactBackupRow(contact: GhlContact, nameMap: Map<string, string>, syncedAt: string) {
  return {
    ghl_contact_id: contact.id,
    location_id: contact.locationId,
    first_name: contact.firstName ?? null,
    last_name: contact.lastName ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    company_name: contact.companyName ?? null,
    owner_id: contact.assignedTo ?? null,
    tags: contact.tags ?? [],
    custom_fields: mapAllCustomFields(contact.customFields, nameMap),
    raw: contact,
    date_added: contact.dateAdded ?? null,
    date_updated: contact.dateUpdated ?? null,
    synced_at: syncedAt,
    deleted_at: null,
  };
}

function opportunityBackupRow(opp: GhlOpportunity, syncedAt: string) {
  return {
    ghl_opportunity_id: opp.id,
    contact_id: opp.contactId ?? null,
    pipeline_id: opp.pipelineId,
    stage_id: opp.pipelineStageId,
    name: opp.name,
    monetary_value: opp.monetaryValue ?? 0,
    status: opp.status,
    owner_id: opp.assignedTo ?? null,
    raw: opp,
    date_added: opp.createdAt ?? null,
    date_updated: opp.updatedAt ?? null,
    synced_at: syncedAt,
    deleted_at: null,
  };
}

// Upserts every contact GHL has (no "Main" tag filter — this is a complete
// backup), then soft-deletes any previously-backed-up contact this pass
// didn't see: comparing synced_at against this run's start timestamp scales
// to any table size without needing a giant NOT IN (...) id list.
export async function backupAllContacts(contacts: GhlContact[], nameMap: Map<string, string>) {
  const syncedAt = new Date().toISOString();
  const rows = contacts.map((c) => contactBackupRow(c, nameMap, syncedAt));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin.from("ghl_backup_contacts").upsert(rows.slice(i, i + BATCH_SIZE));
    if (error) throw error;
  }

  const { error: staleError } = await supabaseAdmin
    .from("ghl_backup_contacts")
    .update({ deleted_at: syncedAt })
    .lt("synced_at", syncedAt)
    .is("deleted_at", null);
  if (staleError) throw staleError;

  return { synced: rows.length, syncedAt };
}

export async function backupAllOpportunities(opportunities: GhlOpportunity[]) {
  const syncedAt = new Date().toISOString();
  const rows = opportunities.map((o) => opportunityBackupRow(o, syncedAt));

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin.from("ghl_backup_opportunities").upsert(rows.slice(i, i + BATCH_SIZE));
    if (error) throw error;
  }

  const { error: staleError } = await supabaseAdmin
    .from("ghl_backup_opportunities")
    .update({ deleted_at: syncedAt })
    .lt("synced_at", syncedAt)
    .is("deleted_at", null);
  if (staleError) throw staleError;

  return { synced: rows.length, syncedAt };
}

// Per-contact refresh of notes/tasks/appointments, used by the activity
// sweep. Soft-deletes anything for THIS contact not seen in the fresh fetch
// (scoped by contact_id, so it never touches other contacts' rows).
export async function backupContactActivity(
  contactId: string,
  activity: { notes: GhlNote[]; tasks: GhlTask[]; appointments: GhlAppointment[] }
) {
  const syncedAt = new Date().toISOString();

  if (activity.notes.length > 0) {
    const { error } = await supabaseAdmin.from("ghl_backup_notes").upsert(
      activity.notes.map((n) => ({
        ghl_note_id: n.id,
        contact_id: contactId,
        body: n.bodyText ?? n.body ?? null,
        user_id: n.userId ?? null,
        date_added: n.dateAdded ?? null,
        raw: n,
        synced_at: syncedAt,
        deleted_at: null,
      }))
    );
    if (error) throw error;
  }
  await staleifyContactRows("ghl_backup_notes", contactId, syncedAt);

  if (activity.tasks.length > 0) {
    const { error } = await supabaseAdmin.from("ghl_backup_tasks").upsert(
      activity.tasks.map((t) => ({
        ghl_task_id: t.id,
        contact_id: contactId,
        title: t.title,
        body: t.body ?? null,
        due_date: t.dueDate ?? null,
        completed: t.completed,
        assigned_to: t.assignedTo ?? null,
        raw: t,
        synced_at: syncedAt,
        deleted_at: null,
      }))
    );
    if (error) throw error;
  }
  await staleifyContactRows("ghl_backup_tasks", contactId, syncedAt);

  if (activity.appointments.length > 0) {
    const { error } = await supabaseAdmin.from("ghl_backup_appointments").upsert(
      activity.appointments.map((a) => ({
        ghl_appointment_id: a.id,
        contact_id: contactId,
        calendar_id: a.calendarId,
        title: a.title,
        start_time: a.startTime,
        end_time: a.endTime,
        status: a.appointmentStatus,
        assigned_user_id: a.assignedUserId ?? null,
        raw: a,
        date_added: a.dateAdded ?? null,
        synced_at: syncedAt,
        deleted_at: null,
      }))
    );
    if (error) throw error;
  }
  await staleifyContactRows("ghl_backup_appointments", contactId, syncedAt);
}

async function staleifyContactRows(
  table: "ghl_backup_notes" | "ghl_backup_tasks" | "ghl_backup_appointments",
  contactId: string,
  syncedAt: string
) {
  const { error } = await supabaseAdmin
    .from(table)
    .update({ deleted_at: syncedAt })
    .eq("contact_id", contactId)
    .lt("synced_at", syncedAt)
    .is("deleted_at", null);
  if (error) throw error;
}

// Called when a contact 404s during the sweep (deleted in GHL) — the
// contact row and everything under it gets soft-deleted together.
export async function markContactAndActivityDeleted(contactId: string) {
  const deletedAt = new Date().toISOString();
  const tables = ["ghl_backup_contacts", "ghl_backup_notes", "ghl_backup_tasks", "ghl_backup_appointments"] as const;
  for (const table of tables) {
    const idColumn = table === "ghl_backup_contacts" ? "ghl_contact_id" : "contact_id";
    const { error } = await supabaseAdmin.from(table).update({ deleted_at: deletedAt }).eq(idColumn, contactId).is("deleted_at", null);
    if (error) throw error;
  }
}
