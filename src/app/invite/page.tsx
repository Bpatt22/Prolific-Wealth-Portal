"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function InvitePage() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    function finish(sessionEmail: string | null | undefined) {
      if (cancelled) return;
      setEmail(sessionEmail ?? null);
      setChecking(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) finish(session.user.email);
    });

    (async () => {
      // The invite link puts the session in the URL hash (#access_token=...&refresh_token=...).
      // The Supabase client normally parses this automatically on load, but that happens
      // asynchronously — set it explicitly ourselves so we're not racing that detection.
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error && data.session?.user) {
          finish(data.session.user.email);
          return;
        }
      }

      // No hash tokens (or setSession failed) — fall back to checking for an
      // already-established session before giving up, in case onAuthStateChange
      // already fired.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      finish(session?.user?.email);
    })();

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--navy-900)",
        padding: "0 16px",
        minHeight: "100vh",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380, padding: 32 }}>
        <div className="brand" style={{ padding: 0, marginBottom: 22 }}>
          <div className="brand-mark">PW</div>
          <div className="brand-text">
            <div className="name" style={{ color: "var(--ink)" }}>
              Prolific Wealth Group
            </div>
            <div className="sub" style={{ color: "var(--slate)" }}>
              Set up your portal account
            </div>
          </div>
        </div>

        {checking ? (
          <p style={{ fontSize: 13, color: "var(--slate)" }}>Checking your invite…</p>
        ) : !email ? (
          <p style={{ fontSize: 13, color: "var(--red-600)" }}>
            This invite link is invalid or has expired. Ask your admin to send a new one.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="stack" style={{ gap: 14 }}>
              <div className="field">
                <label>Email</label>
                <input value={email} disabled />
              </div>
              <div className="field">
                <label>Set a password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div className="field">
                <label>Confirm password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
              </div>
            </div>

            {error && (
              <p style={{ marginTop: 16, borderRadius: 8, background: "var(--red-100)", padding: "8px 12px", fontSize: 13, color: "var(--red-600)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={saving} className="btn btn-dark" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
              {saving ? "Setting up…" : "Set password & sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
