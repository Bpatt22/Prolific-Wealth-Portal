import "server-only";
import { notFound } from "next/navigation";
import { getContact, listAppointments, listNotes, listTasks } from "./ghl/contacts";
import { mapCustomFieldsToPortalKeys } from "./ghl/mapCustomFields";
import { canAccessContact } from "./ghl/constants";
import type { TeamMember } from "./auth";

export async function loadContactDetail(contactId: string, member: TeamMember) {
  const contact = await getContact(contactId).catch(() => null);
  // Not found, missing the portal-visible tag, and "assigned to someone else"
  // all 404 — we don't want to reveal that a contact exists to someone who
  // shouldn't see it. The tag check applies even to owners.
  if (!contact || !canAccessContact(contact, member)) notFound();

  const [notes, appointments, tasks] = await Promise.all([
    listNotes(contactId).catch(() => []),
    listAppointments(contactId).catch(() => []),
    listTasks(contactId).catch(() => []),
  ]);

  return {
    contact,
    portalFields: mapCustomFieldsToPortalKeys(contact.customFields),
    notes,
    appointments,
    tasks,
  };
}
