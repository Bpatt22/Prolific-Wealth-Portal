"use client";

import { useState } from "react";

type Task = { id: string; title: string; dueDate?: string | null; completed: boolean };

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default function TasksSection({ contactId, initialTasks }: { contactId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddTask() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), dueDate: dueDate || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setTasks((prev) => [data.task, ...prev]);
        setTitle("");
        setDueDate("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t)));
    const res = await fetch(`/api/contacts/${contactId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    if (!res.ok) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: task.completed } : t)));
    }
  }

  return (
    <section className="card card-pad">
      <div className="section-head">
        <h2>Tasks</h2>
      </div>

      <div className="field-row">
        <div className="field">
          <label>New task</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Follow up on stipulations" />
        </div>
        <div className="field" style={{ maxWidth: 180 }}>
          <label>Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button onClick={handleAddTask} disabled={saving} className="btn btn-dark">
          {saving ? "Adding…" : "Add task"}
        </button>
      </div>

      <div className="stack" style={{ gap: 8, marginTop: 16 }}>
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
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={t.completed} onChange={() => handleToggle(t)} />
              <span style={t.completed ? { color: "var(--slate-light)", textDecoration: "line-through" } : undefined}>
                {t.title}
              </span>
            </label>
            <span className="cell-sub">{formatDate(t.dueDate)}</span>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="empty-state">
            <div className="t">No tasks</div>
          </div>
        )}
      </div>
    </section>
  );
}
