import "server-only";
import { notFound } from "next/navigation";
import { getContact, listAppointments, listNotes, listTasks } from "./ghl/contacts";
import { mapCustomFieldsToPortalKeys } from "./ghl/mapCustomFields";
import { canAffiliateAccessContact } from "./ghl/constants";
import type { Affiliate } from "./affiliateAuth";

export async function loadAffiliateContactDetail(contactId: string, affiliate: Affiliate) {
  const contact = await getContact(contactId).catch(() => null);
  const portalFields = contact ? mapCustomFieldsToPortalKeys(contact.customFields) : {};

  // Not found and "referred by someone else" both 404 — no reason to reveal
  // a contact exists to an affiliate it isn't theirs.
  if (!contact || !canAffiliateAccessContact({ tags: contact.tags, referredBy: portalFields.referredBy as string | undefined }, affiliate)) {
    notFound();
  }

  const [notes, appointments, tasks] = await Promise.all([
    listNotes(contactId).catch(() => []),
    listAppointments(contactId).catch(() => []),
    listTasks(contactId).catch(() => []),
  ]);

  return { contact, portalFields, notes, appointments, tasks };
}
