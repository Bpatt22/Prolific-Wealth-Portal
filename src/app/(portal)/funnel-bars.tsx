type Row = { label: string; count: number; sublabel: string };

export default function FunnelBars({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div>
      {rows.map((r) => {
        const pct = Math.round((r.count / max) * 100);
        return (
          <div key={r.label} style={{ marginBottom: 12 }}>
            <div className="row between" style={{ fontSize: 12, marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>{r.label}</span>
              <span className="num" style={{ color: "var(--slate)" }}>
                {r.sublabel}
              </span>
            </div>
            <div style={{ height: 9, background: "var(--border-soft)", borderRadius: 5, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(pct, r.count > 0 ? 4 : 0)}%`,
                  background: "linear-gradient(90deg, var(--sky-500), var(--navy-600))",
                  borderRadius: 5,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
