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
    <div className="stack">
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>{fullName}</h2>
        <p style={{ marginTop: 4, fontSize: 12.5, color: "var(--slate)" }}>
          {contact.email ?? "No email"} · {contact.phone ?? "No phone"}
        </p>
        {!!contact.tags?.length && (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {contact.tags.map((tag) => (
              <span key={tag} className="badge badge-slate">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <EditableFields contactId={contact.id} portalFields={portalFields} />

      <section className="card card-pad">
        <div className="section-head">
          <h2>Other fields</h2>
        </div>
        <div className="kv">
          {(Object.entries(VIEW_ONLY_FIELDS) as [keyof typeof VIEW_ONLY_FIELDS, { label: string }][]).map(([key, field]) => (
            <div className="item" key={key}>
              <div className="k">{field.label}</div>
              <div className="v">
                {portalFields[key] !== undefined && portalFields[key] !== null && portalFields[key] !== ""
                  ? String(portalFields[key])
                  : "—"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-pad">
        <div className="section-head">
          <h2>Appointments</h2>
        </div>
        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="t">No appointments</div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {appointments.map((a) => (
              <div key={a.id} style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                <div className="cell-sub">
                  {formatDate(a.startTime)} – {formatDate(a.endTime)} · {a.appointmentStatus}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {tasks.length > 0 && (
        <section className="card card-pad">
          <div className="section-head">
            <h2>Tasks</h2>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 13,
                }}
              >
                <span style={t.completed ? { color: "var(--slate-light)", textDecoration: "line-through" } : undefined}>
                  {t.title}
                </span>
                <span className="cell-sub">{formatDate(t.dueDate)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <NotesSection contactId={contact.id} initialNotes={notes} />
    </div>
  );
}
