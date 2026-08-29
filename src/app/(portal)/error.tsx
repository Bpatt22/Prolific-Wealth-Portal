"use client";

export default function PortalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--navy-900)",
        padding: "0 16px",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32, textAlign: "center" }}>
        <div className="brand" style={{ padding: 0, marginBottom: 18, justifyContent: "center" }}>
          <div className="brand-mark">PW</div>
        </div>
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>Can't load your portal yet</h2>
        <p style={{ fontSize: 13, color: "var(--slate)", lineHeight: 1.5 }}>{error.message}</p>
        <p style={{ fontSize: 12, color: "var(--slate-light)", marginTop: 16 }}>
          If this is your first time signing in, ask your admin to add you as a team member.
        </p>
      </div>
    </div>
  );
}
