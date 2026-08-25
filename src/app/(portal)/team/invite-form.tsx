"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InviteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to invite team member");

      setSuccess(`Invited ${name} — they'll get an email to set their password.`);
      setName("");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card card-pad">
      <div className="section-head">
        <h2>Add team member</h2>
        <p>Creates a real GHL user and emails them a portal invite</p>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Jordan Taylor" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jordan@example.com" />
        </div>
      </div>
      {error && <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--red-600)" }}>{error}</p>}
      {success && <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--green-600)" }}>{success}</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Adding…" : "Add team member"}
        </button>
      </div>
    </form>
  );
}
