"use client";

import { useState } from "react";
import { EDITABLE_FIELDS } from "@/lib/ghl/constants";

type Props = {
  contactId: string;
  portalFields: Record<string, unknown>;
};

export default function EditableFields({ contactId, portalFields }: Props) {
  const [values, setValues] = useState<Record<string, string>>({
    fundingApproved: (portalFields.fundingApproved as string) ?? "",
    fundingAmount: portalFields.fundingAmount != null ? String(portalFields.fundingAmount) : "",
    amountPaidToReferrer: (portalFields.amountPaidToReferrer as string) ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const fields = [
        { id: EDITABLE_FIELDS.fundingApproved.id, value: values.fundingApproved },
        {
          id: EDITABLE_FIELDS.fundingAmount.id,
          value: values.fundingAmount === "" ? null : Number(values.fundingAmount),
        },
        { id: EDITABLE_FIELDS.amountPaidToReferrer.id, value: values.amountPaidToReferrer },
      ];

      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save");
      }

      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card card-pad">
      <div className="section-head">
        <h2>Funding</h2>
      </div>
      <div className="field-row3">
        <div className="field">
          <label>{EDITABLE_FIELDS.fundingApproved.label}</label>
          <select
            value={values.fundingApproved}
            onChange={(e) => setValues((v) => ({ ...v, fundingApproved: e.target.value }))}
          >
            <option value="">—</option>
            {EDITABLE_FIELDS.fundingApproved.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{EDITABLE_FIELDS.fundingAmount.label}</label>
          <input
            type="number"
            value={values.fundingAmount}
            onChange={(e) => setValues((v) => ({ ...v, fundingAmount: e.target.value }))}
          />
        </div>

        <div className="field">
          <label>{EDITABLE_FIELDS.amountPaidToReferrer.label}</label>
          <select
            value={values.amountPaidToReferrer}
            onChange={(e) => setValues((v) => ({ ...v, amountPaidToReferrer: e.target.value }))}
          >
            <option value="">—</option>
            {EDITABLE_FIELDS.amountPaidToReferrer.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row" style={{ gap: 12, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} className="btn btn-dark">
          {saving ? "Saving…" : "Save to GHL"}
        </button>
        {savedAt && !error && <span style={{ fontSize: 12, color: "var(--green-600)" }}>Saved</span>}
        {error && <span style={{ fontSize: 12, color: "var(--red-600)" }}>{error}</span>}
      </div>
    </section>
  );
}
