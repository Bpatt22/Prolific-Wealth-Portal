import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { mapCustomFieldsToPortalKeys } from "./ghl/mapCustomFields";
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

export async function upsertContactMirror(contact: GhlContact) {
  const { error } = await supabaseAdmin.from("contacts").upsert(contactRow(contact));
  if (error) throw error;
}

export async function upsertOpportunityMirror(opp: GhlOpportunity) {
  const { error } = await supabaseAdmin.from("opportunities").upsert(opportunityRow(opp));
  if (error) throw error;
}

const BATCH_SIZE = 200;

export async function upsertContactsMirrorBatch(contacts: GhlContact[]) {
  const rows = contacts.map(contactRow);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin.from("contacts").upsert(rows.slice(i, i + BATCH_SIZE));
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
