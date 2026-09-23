import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { mapCustomFieldsToPortalKeys } from "./ghl/mapCustomFields";
import { hasPortalVisibleTag } from "./ghl/constants";
import type { GhlContact, GhlOpportunity } from "./ghl/types";

function contactRow(contact: GhlContact) {
  return {
    ghl_contact_id: contact.id,
    location_id: contact.locationId,
    first_name: contact.firstName ?? null,
    last_name: contact.lastName ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    owner_id: contact.assignedTo ?? null,
    tags: contact.tags ?? [],
    custom_fields: mapCustomFieldsToPortalKeys(contact.customFields),
    date_added: contact.dateAdded ?? null,
    date_updated: contact.dateUpdated ?? null,
    synced_at: new Date().toISOString(),
  };
}

function opportunityRow(opp: GhlOpportunity) {
  return {
    ghl_opportunity_id: opp.id,
    contact_id: opp.contactId ?? null,
    pipeline_id: opp.pipelineId,
    stage_id: opp.pipelineStageId,
    name: opp.name,
    monetary_value: opp.monetaryValue ?? 0,
    status: opp.status,
    owner_id: opp.assignedTo ?? null,
    date_added: opp.createdAt ?? null,
    date_updated: opp.updatedAt ?? null,
    synced_at: new Date().toISOString(),
  };
}

// Only mirrors the contact if it carries the portal-visible tag; otherwise
// removes it from the mirror (covers both "never qualified" and "tag was
// just removed" — e.g. from a webhook firing on a tag change).
export async function upsertContactMirror(contact: GhlContact) {
  if (!hasPortalVisibleTag(contact.tags)) {
    return deleteContactMirror(contact.id);
  }
  const { error } = await supabaseAdmin.from("contacts").upsert(contactRow(contact));
  if (error) throw error;
}

export async function upsertOpportunityMirror(opp: GhlOpportunity) {
  const { error } = await supabaseAdmin.from("opportunities").upsert(opportunityRow(opp));
  if (error) throw error;
}

const BATCH_SIZE = 200;

// Mirrors only contacts carrying the portal-visible tag, and cleans up any
// previously-mirrored contact that no longer qualifies (tag removed, or
// this is the first sync since the tag rule was introduced). Because this
// runs against the *complete* contact list on every cycle (backfill/cron),
// the mirror self-heals regardless of how a contact's tag changed.
export async function upsertContactsMirrorBatch(contacts: GhlContact[]) {
  const qualifying = contacts.filter((c) => hasPortalVisibleTag(c.tags));
  const disqualifying = contacts.filter((c) => !hasPortalVisibleTag(c.tags)).map((c) => c.id);

  const rows = qualifying.map(contactRow);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin.from("contacts").upsert(rows.slice(i, i + BATCH_SIZE));
    if (error) throw error;
  }

  for (let i = 0; i < disqualifying.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin
      .from("contacts")
      .delete()
      .in("ghl_contact_id", disqualifying.slice(i, i + BATCH_SIZE));
    if (error) throw error;
  }
}

export async function upsertOpportunitiesMirrorBatch(opportunities: GhlOpportunity[]) {
  const rows = opportunities.map(opportunityRow);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin.from("opportunities").upsert(rows.slice(i, i + BATCH_SIZE));
    if (error) throw error;
  }
}

export async function deleteContactMirror(ghlContactId: string) {
  const { error } = await supabaseAdmin.from("contacts").delete().eq("ghl_contact_id", ghlContactId);
  if (error) throw error;
}

export async function deleteOpportunityMirror(ghlOpportunityId: string) {
  const { error } = await supabaseAdmin.from("opportunities").delete().eq("ghl_opportunity_id", ghlOpportunityId);
  if (error) throw error;
}
