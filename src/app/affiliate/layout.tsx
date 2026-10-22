import { getCurrentAffiliate } from "@/lib/affiliateAuth";
import SignOutButton from "../(portal)/sign-out-button";
import NavLink from "../(portal)/nav-link";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const affiliate = await getCurrentAffiliate();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PW</div>
          <div className="brand-text">
            <div className="name">Prolific Wealth Group</div>
            <div className="sub">Affiliate Portal</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-group-label">Overview</div>
          <NavLink href="/affiliate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M2.5 20c1-3.8 3.6-5.8 6.5-5.8s5.5 2 6.5 5.8" />
              <circle cx="18" cy="8.5" r="2.3" />
              <path d="M16 14.3c2.5.4 4.2 2.1 5 5.3" />
            </svg>
            My Referrals
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <span style={{ fontSize: 11, color: "#7c8fae" }}>Read-only — contacts referred by you, live from GHL.</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="page-title">Prolific Wealth Group</div>
            <div className="page-sub">Affiliate portal</div>
          </div>
          <div style={{ flex: 1 }} />
          <div className="topbar-actions">
            <div className="user-chip">
              <div className="avatar">{initials(affiliate.name)}</div>
              <div className="who">
                <div className="n">{affiliate.name}</div>
                <div className="r">Affiliate · view only</div>
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
