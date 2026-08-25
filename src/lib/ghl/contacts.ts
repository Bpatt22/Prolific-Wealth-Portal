import { ghl } from "./client";
import { GHL_LOCATION_ID } from "./constants";
import type { GhlAppointment, GhlContact, GhlNote, GhlTask } from "./types";

export function getContact(contactId: string) {
  return ghl.get<{ contact: GhlContact }>(`/contacts/${contactId}`).then((r) => r.contact);
}

export function listContactsPage(params: { limit?: number; startAfter?: string; startAfterId?: string; query?: string } = {}) {
  const qs = new URLSearchParams({ locationId: GHL_LOCATION_ID, limit: String(params.limit ?? 100) });
  if (params.startAfter) qs.set("startAfter", params.startAfter);
  if (params.startAfterId) qs.set("startAfterId", params.startAfterId);
  if (params.query) qs.set("query", params.query);
  return ghl.get<{ contacts: GhlContact[]; meta: { total: number; startAfter?: number; startAfterId?: string } }>(
    `/contacts/?${qs.toString()}`
  );
}

export async function listAllContacts(): Promise<GhlContact[]> {
  const all: GhlContact[] = [];
  let startAfter: string | undefined;
  let startAfterId: string | undefined;

  for (;;) {
    const page = await listContactsPage({ limit: 100, startAfter, startAfterId });
    all.push(...page.contacts);
    if (page.contacts.length === 0 || !page.meta.startAfterId) break;
    startAfter = String(page.meta.startAfter);
    startAfterId = page.meta.startAfterId;
    if (all.length >= page.meta.total) break;
  }

  return all;
}

export function updateContactFields(
  contactId: string,
  fields: { customFields?: { id: string; value: unknown }[]; tags?: string[] }
) {
  return ghl.put<{ contact: GhlContact }>(`/contacts/${contactId}`, fields);
}

export function createContact(input: {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string;
  assignedTo?: string;
}) {
  return ghl
    .post<{ contact: GhlContact }>("/contacts/", { locationId: GHL_LOCATION_ID, ...input })
    .then((r) => r.contact);
}

export function deleteContact(contactId: string) {
  return ghl.delete<unknown>(`/contacts/${contactId}`);
}

export function listNotes(contactId: string) {
  return ghl.get<{ notes: GhlNote[] }>(`/contacts/${contactId}/notes`).then((r) => r.notes);
}

export function createNote(contactId: string, body: string, userId?: string) {
  return ghl.post<{ note: GhlNote }>(`/contacts/${contactId}/notes`, { body, userId }).then((r) => r.note);
}

export function listAppointments(contactId: string) {
  return ghl.get<{ events: GhlAppointment[] }>(`/contacts/${contactId}/appointments`).then((r) => r.events);
}

export function listTasks(contactId: string) {
  return ghl.get<{ tasks: GhlTask[] }>(`/contacts/${contactId}/tasks`).then((r) => r.tasks);
}

export function createTask(contactId: string, input: { title: string; dueDate: string; assignedTo?: string }) {
  return ghl
    .post<{ task: GhlTask }>(`/contacts/${contactId}/tasks`, { ...input, completed: false })
    .then((r) => r.task);
}

export function updateTask(contactId: string, taskId: string, input: { completed?: boolean; title?: string; dueDate?: string }) {
  return ghl.put<{ task: GhlTask }>(`/contacts/${contactId}/tasks/${taskId}`, input).then((r) => r.task);
}
