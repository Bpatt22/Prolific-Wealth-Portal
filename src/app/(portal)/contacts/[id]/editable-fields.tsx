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
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Funding</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs text-zinc-500">{EDITABLE_FIELDS.fundingApproved.label}</label>
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
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

        <div>
          <label className="block text-xs text-zinc-500">{EDITABLE_FIELDS.fundingAmount.label}</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
            value={values.fundingAmount}
            onChange={(e) => setValues((v) => ({ ...v, fundingAmount: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-xs text-zinc-500">{EDITABLE_FIELDS.amountPaidToReferrer.label}</label>
          <select
            className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
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

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save to GHL"}
        </button>
        {savedAt && !error && <span className="text-xs text-emerald-600">Saved</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </section>
  );
}
