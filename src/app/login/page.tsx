"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--navy-900)",
        padding: "0 16px",
      }}
    >
      <form action={formAction} className="card" style={{ width: "100%", maxWidth: 380, padding: 32 }}>
        <div className="brand" style={{ padding: 0, marginBottom: 22 }}>
          <div className="brand-mark">PW</div>
          <div className="brand-text">
            <div className="name" style={{ color: "var(--ink)" }}>
              Prolific Wealth Group
            </div>
            <div className="sub" style={{ color: "var(--slate)" }}>
              Team Portal
            </div>
          </div>
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
        </div>

        {state.error && (
          <p style={{ marginTop: 16, borderRadius: 8, background: "var(--red-100)", padding: "8px 12px", fontSize: 13, color: "var(--red-600)" }}>
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-dark" style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
