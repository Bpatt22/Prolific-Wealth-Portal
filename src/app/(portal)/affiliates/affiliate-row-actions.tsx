"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AffiliateRowActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!window.confirm(`Remove ${name}? This deletes their portal login and the matching n8n row.`)) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/affiliates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove affiliate");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <button onClick={handleRemove} disabled={removing} className="btn btn-sm">
      {removing ? "Removing…" : "Remove"}
    </button>
  );
}
