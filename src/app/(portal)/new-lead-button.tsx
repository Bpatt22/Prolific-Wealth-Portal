"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewLeadButton({ className, children }: { className: string; children: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    fundingAsk: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          fundingAsk: values.fundingAsk ? Number(values.fundingAsk) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create lead");
      setOpen(false);
      router.push(`/contacts/${data.contact.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {children}
      </button>

      <div className={`overlay${open ? " open" : ""}`} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
        <div className="modal">
          <div className="modal-head">
            <div>
              <h3>New client / lead</h3>
              <p>Creates a real contact in GHL and an opportunity in the pipeline</p>
            </div>
            <button type="button" className="close-x" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="field-row">
                <div className="field">
                  <label>First name</label>
                  <input value={values.firstName} onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Last name</label>
                  <input value={values.lastName} onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Company name</label>
                <input value={values.companyName} onChange={(e) => setValues((v) => ({ ...v, companyName: e.target.value }))} />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input type="tel" value={values.phone} onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Funding ask</label>
                <input
                  type="number"
                  min="0"
                  value={values.fundingAsk}
                  onChange={(e) => setValues((v) => ({ ...v, fundingAsk: e.target.value }))}
                  placeholder="50000"
                />
              </div>
              {error && <p style={{ margin: 0, fontSize: 12.5, color: "var(--red-600)" }}>{error}</p>}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Adding…" : "Add to pipeline"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
