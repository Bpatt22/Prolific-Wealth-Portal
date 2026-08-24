"use client";

import { useState } from "react";

type Note = { id: string; body: string; dateAdded: string };

export default function NotesSection({ contactId, initialNotes }: { contactId: string; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddNote() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotes((prev) => [data.note, ...prev]);
        setDraft("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card card-pad">
      <div className="section-head">
        <h2>Notes</h2>
      </div>

      <div className="row" style={{ gap: 8, alignItems: "flex-start" }}>
        <div className="field" style={{ flex: 1 }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2} placeholder="Add a note…" />
        </div>
        <button onClick={handleAddNote} disabled={saving} className="btn btn-dark">
          Add
        </button>
      </div>

      <div className="stack" style={{ gap: 10, marginTop: 16 }}>
        {notes.map((n) => (
          <div key={n.id} style={{ border: "1px solid var(--border-soft)", borderRadius: 8, padding: 12 }}>
            <p style={{ margin: 0, fontSize: 13, whiteSpace: "pre-wrap", color: "var(--ink)" }}>{n.body}</p>
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--slate-light)" }}>{new Date(n.dateAdded).toLocaleString()}</p>
          </div>
        ))}
        {notes.length === 0 && (
          <div className="empty-state">
            <div className="t">No notes yet</div>
          </div>
        )}
      </div>
    </section>
  );
}
