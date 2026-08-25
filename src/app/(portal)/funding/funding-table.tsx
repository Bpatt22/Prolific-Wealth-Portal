"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FundingRow = {
  "Client Name": string | null;
  "Funding Amount": number | null;
  "Approval Date": string | null;
  "Prolific Fee": number | null;
  "Invoice Status": string | null;
  "Invoice URL": string | null;
  "Referred by": string | null;
  "GHL Contact ID": string | null;
};

function fmtMoney(n: number | null) {
  if (n === null || n === undefined) return "—";
  return "$" + Number(n).toLocaleString("en-US");
}

export default function FundingTable({ rows }: { rows: FundingRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const statuses = useMemo(
    () => Array.from(new Set(rows.map((r) => r["Invoice Status"]).filter(Boolean))) as string[],
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (q && !(r["Client Name"] ?? "").toLowerCase().includes(q.toLowerCase())) return false;
    if (status && r["Invoice Status"] !== status) return false;
    return true;
  });

  const totalFunding = filtered.reduce((s, r) => s + Number(r["Funding Amount"] ?? 0), 0);
  const totalFees = filtered.reduce((s, r) => s + Number(r["Prolific Fee"] ?? 0), 0);

  return (
    <div>
      <div className="filter-bar">
        <input type="text" placeholder="Search client…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <a href="/api/export/funding-ledger" className="btn btn-sm" style={{ marginLeft: "auto" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12M7 10l5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
          Export CSV
        </a>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Funding amount</th>
              <th>Prolific fee</th>
              <th>Status</th>
              <th>Approval date</th>
              <th>Referred by</th>
              <th>Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td>
                  {r["GHL Contact ID"] ? (
                    <Link href={`/contacts/${r["GHL Contact ID"]}`} className="cell-primary" style={{ textDecoration: "none", color: "inherit" }}>
                      {r["Client Name"] ?? "—"}
                    </Link>
                  ) : (
                    <span className="cell-primary">{r["Client Name"] ?? "—"}</span>
                  )}
                </td>
                <td className="num">{fmtMoney(r["Funding Amount"])}</td>
                <td className="num">{fmtMoney(r["Prolific Fee"])}</td>
                <td>
                  <span className="badge badge-blue">{r["Invoice Status"] ?? "—"}</span>
                </td>
                <td className="cell-sub">{r["Approval Date"] ?? "—"}</td>
                <td className="cell-sub">{r["Referred by"] ?? "—"}</td>
                <td>
                  {r["Invoice URL"] ? (
                    <a href={r["Invoice URL"]} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr className="table-summary">
                <td>Total ({filtered.length})</td>
                <td className="num">{fmtMoney(totalFunding)}</td>
                <td className="num">{fmtMoney(totalFees)}</td>
                <td colSpan={4}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="t">No funding records</div>
          <div className="d">Funded deals for your clients will show up here automatically.</div>
        </div>
      )}
    </div>
  );
}
