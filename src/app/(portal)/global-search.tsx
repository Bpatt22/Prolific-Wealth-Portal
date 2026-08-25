"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Result = { id: string; name: string; email: string | null };

export default function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((d) => setResults(d.results ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", flex: 1, maxWidth: 360, marginLeft: 12 }}>
      <input
        type="text"
        placeholder="Search your clients…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 9,
          border: "1px solid var(--border)",
          background: "var(--canvas)",
          fontSize: 13,
          color: "var(--ink)",
        }}
      />
      {open && results.length > 0 && (
        <div
          className="card"
          style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, padding: 6, zIndex: 50 }}
        >
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setOpen(false);
                setQ("");
                router.push(`/contacts/${r.id}`);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--canvas)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontWeight: 600 }}>{r.name}</div>
              {r.email && <div style={{ fontSize: 11.5, color: "var(--slate)" }}>{r.email}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
