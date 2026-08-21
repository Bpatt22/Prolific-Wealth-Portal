import { getCurrentTeamMember } from "@/lib/auth";
import { loadContactDetail } from "@/lib/contactDetail";
import { VIEW_ONLY_FIELDS } from "@/lib/ghl/constants";
import EditableFields from "./editable-fields";
import NotesSection from "./notes-section";

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getCurrentTeamMember();
  const { contact, portalFields, notes, appointments, tasks } = await loadContactDetail(id, member);

  const fullName = contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed contact";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-900">{fullName}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {contact.email ?? "No email"} · {contact.phone ?? "No phone"}
        </p>
        {!!contact.tags?.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {contact.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs text-zinc-700">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <EditableFields contactId={contact.id} portalFields={portalFields} />

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Other fields</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {(Object.entries(VIEW_ONLY_FIELDS) as [keyof typeof VIEW_ONLY_FIELDS, { label: string }][]).map(
            ([key, field]) => (
              <div key={key}>
                <dt className="text-xs text-zinc-500">{field.label}</dt>
                <dd className="text-sm text-zinc-900">
                  {portalFields[key] !== undefined && portalFields[key] !== null && portalFields[key] !== ""
                    ? String(portalFields[key])
                    : "—"}
                </dd>
              </div>
            )
          )}
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">Appointments</h2>
        {appointments.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No appointments.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {appointments.map((a) => (
              <li key={a.id} className="rounded-md border border-zinc-100 p-3 text-sm">
                <p className="font-medium text-zinc-900">{a.title}</p>
                <p className="text-xs text-zinc-500">
                  {formatDate(a.startTime)} – {formatDate(a.endTime)} · {a.appointmentStatus}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tasks.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Tasks</h2>
          <ul className="mt-3 space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-md border border-zinc-100 p-3 text-sm">
                <span className={t.completed ? "text-zinc-400 line-through" : "text-zinc-900"}>{t.title}</span>
                <span className="text-xs text-zinc-500">{formatDate(t.dueDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NotesSection contactId={contact.id} initialNotes={notes} />
    </div>
  );
}
