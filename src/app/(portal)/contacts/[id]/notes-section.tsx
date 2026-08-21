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
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Notes</h2>

      <div className="mt-3 flex gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          onClick={handleAddNote}
          disabled={saving}
          className="self-start rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <ul className="mt-4 space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-md border border-zinc-100 p-3 text-sm">
            <p className="whitespace-pre-wrap text-zinc-800">{n.body}</p>
            <p className="mt-1 text-xs text-zinc-400">{new Date(n.dateAdded).toLocaleString()}</p>
          </li>
        ))}
        {notes.length === 0 && <p className="text-sm text-zinc-500">No notes yet.</p>}
      </ul>
    </section>
  );
}
