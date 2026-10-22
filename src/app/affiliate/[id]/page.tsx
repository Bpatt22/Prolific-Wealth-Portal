import { getCurrentAffiliate } from "@/lib/affiliateAuth";
import { loadAffiliateContactDetail } from "@/lib/affiliateContactDetail";
import { EDITABLE_FIELDS, VIEW_ONLY_FIELDS } from "@/lib/ghl/constants";

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString();
}

const DISPLAY_FIELDS = { ...EDITABLE_FIELDS, ...VIEW_ONLY_FIELDS };

export default async function AffiliateContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const affiliate = await getCurrentAffiliate();
  const { contact, portalFields, notes, appointments, tasks } = await loadAffiliateContactDetail(id, affiliate);

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

      <section className="card card-pad">
        <div className="section-head">
          <h2>Fields</h2>
        </div>
        <div className="kv">
          {(Object.entries(DISPLAY_FIELDS) as [keyof typeof DISPLAY_FIELDS, { label: string }][]).map(([key, field]) => (
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

      <section className="card card-pad">
        <div className="section-head">
          <h2>Tasks</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="t">No tasks</div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {tasks.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
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
        )}
      </section>

      <section className="card card-pad">
        <div className="section-head">
          <h2>Notes</h2>
        </div>
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="t">No notes yet</div>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {notes.map((n) => (
              <div key={n.id} style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap", color: "var(--ink)" }}>{n.body}</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--slate-light)" }}>{formatDate(n.dateAdded)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
