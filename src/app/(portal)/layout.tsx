import Link from "next/link";
import { getCurrentTeamMember } from "@/lib/auth";
import SignOutButton from "./sign-out-button";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentTeamMember();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-zinc-900">Prolific Portal</span>
            <nav className="flex items-center gap-4 text-sm text-zinc-600">
              <Link href="/dashboard" className="hover:text-zinc-900">
                Dashboard
              </Link>
              <Link href="/opportunities" className="hover:text-zinc-900">
                Opportunities
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <span>{member.name ?? member.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
