import Link from "next/link";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import NavLink from "./nav-link";
import SignOutButton from "./sign-out-button";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentTeamMember();
  const displayName = member.name ?? member.email;

  const { count: pipelineCount } = await supabaseAdmin
    .from("opportunities")
    .select("ghl_opportunity_id", { count: "exact", head: true })
    .eq("owner_id", member.ghlUserId)
    .eq("status", "open");

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PW</div>
          <div className="brand-text">
            <div className="name">Prolific Wealth Group</div>
            <div className="sub">Team Portal</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-group-label">Overview</div>
          <NavLink href="/dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="16" width="7" height="5" rx="1.5" />
            </svg>
            Dashboard
          </NavLink>

          <div className="nav-group-label">Deal Flow</div>
          <NavLink href="/opportunities">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h18M6 12h12M10 19h4" />
            </svg>
            Client Pipeline
            {typeof pipelineCount === "number" && <span className="count">{pipelineCount}</span>}
          </NavLink>

          <div className="nav-group-label">Relationships</div>
          <NavLink href="/clients">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M2.5 20c1-3.8 3.6-5.8 6.5-5.8s5.5 2 6.5 5.8" />
              <circle cx="18" cy="8.5" r="2.3" />
              <path d="M16 14.3c2.5.4 4.2 2.1 5 5.3" />
            </svg>
            Clients
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <span style={{ fontSize: 11, color: "#7c8fae" }}>Assigned to you in GHL, live-synced.</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="page-title">Prolific Wealth Group</div>
            <div className="page-sub">Team portal</div>
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <div className="avatar">{initials(displayName)}</div>
              <div className="who">
                <div className="n">{displayName}</div>
                <div className="r">Team member</div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
