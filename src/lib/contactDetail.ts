import "server-only";
import { notFound } from "next/navigation";
import { getContact, listAppointments, listNotes, listTasks } from "./ghl/contacts";
import { mapCustomFieldsToPortalKeys } from "./ghl/mapCustomFields";
import type { TeamMember } from "./auth";

export async function loadContactDetail(contactId: string, member: TeamMember) {
  const contact = await getContact(contactId).catch(() => null);
  // Not found and "assigned to someone else" both 404 — we don't want to reveal
  // that a contact exists to a team member it isn't assigned to. Owners bypass this.
  if (!contact || (!member.isOwner && contact.assignedTo !== member.ghlUserId)) notFound();

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
