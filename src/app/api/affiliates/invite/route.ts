import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyAffiliateAdded } from "@/lib/n8n";

// Owner-only: sends a Supabase Auth invite email to set a portal password
// (same mechanism as team invites), inserts the affiliates row, and notifies
// n8n so it can add a row to its Data Table. Unlike team invites, no GHL
// user is ever created — affiliates are portal-only.
export async function POST(req: NextRequest) {
  const member = await getCurrentTeamMember();
  if (!member.isOwner) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { name, email, site } = (await req.json()) as { name?: string; email?: string; site?: string };
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedSite = site?.trim();

  if (!trimmedName || !trimmedEmail || !trimmedSite) {
    return NextResponse.json({ error: "name, email, and site are required" }, { status: 400 });
  }

  const redirectTo = new URL("/invite", req.nextUrl.origin).toString();
  const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(trimmedEmail, {
    data: { name: trimmedName, role: "affiliate" },
    redirectTo,
  });

  if (inviteError || !invite.user) {
    const message = inviteError?.message ?? "Invite failed: no user returned";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { error: insertError } = await supabaseAdmin.from("affiliates").insert({
    auth_user_id: invite.user.id,
    name: trimmedName,
    email: trimmedEmail,
    site: trimmedSite,
  });

  if (insertError) {
    // Don't leave an orphaned auth user if the affiliates insert failed.
    await supabaseAdmin.auth.admin.deleteUser(invite.user.id).catch(() => {});

    if (insertError.code === "23505") {
      return NextResponse.json({ error: `An affiliate named "${trimmedName}" already exists.` }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await notifyAffiliateAdded({ name: trimmedName, email: trimmedEmail, site: trimmedSite });

  return NextResponse.json({ ok: true });
}
