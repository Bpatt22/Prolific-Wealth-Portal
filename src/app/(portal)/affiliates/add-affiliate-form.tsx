"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddAffiliateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/affiliates/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, site }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add affiliate");

      setSuccess(`Invited ${name} — they'll get an email to set their password.`);
      setName("");
      setEmail("");
      setSite("");
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
        <h2>Add affiliate</h2>
        <p>View-only portal access, scoped by name match on &quot;Referred By?&quot; in GHL</p>
      </div>
      <div className="field-row">
        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Exact name as it'll appear in Referred By?"
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="affiliate@example.com" />
        </div>
        <div className="field">
          <label>Site (calendar embed page)</label>
          <input
            type="url"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            required
            placeholder="https://example.com/booking-page"
          />
        </div>
      </div>
      {error && <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--red-600)" }}>{error}</p>}
      {success && <p style={{ marginTop: 10, fontSize: 12.5, color: "var(--green-600)" }}>{success}</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Adding…" : "Add affiliate"}
        </button>
      </div>
    </form>
  );
}
