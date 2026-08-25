import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createUser, deleteUser } from "@/lib/ghl/users";

// Owner-only: creates a real GHL User, sends a Supabase Auth invite email to
// set a portal password, and maps the two together in team_members. Once the
// invitee sets their password, whatever GHL assigns to their new GHL user
// shows up in their portal automatically.
export async function POST(req: NextRequest) {
  const member = await getCurrentTeamMember();
  if (!member.isOwner) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { name, email } = (await req.json()) as { name?: string; email?: string };
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const [firstName, ...rest] = trimmedName.split(/\s+/);
  const lastName = rest.join(" ") || firstName;

  const ghlUser = await createUser({ firstName, lastName, email: trimmedEmail });

  try {
    const redirectTo = new URL("/invite", req.nextUrl.origin).toString();
    const { data: invite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(trimmedEmail, {
      data: { name: trimmedName },
      redirectTo,
    });

    if (inviteError || !invite.user) {
      throw inviteError ?? new Error("Invite failed: no user returned");
    }

    const { error: mappingError } = await supabaseAdmin.from("team_members").insert({
      auth_user_id: invite.user.id,
      ghl_user_id: ghlUser.id,
      name: trimmedName,
      email: trimmedEmail,
    });

    if (mappingError) throw mappingError;

    return NextResponse.json({ ok: true, ghlUserId: ghlUser.id });
  } catch (err) {
    // Don't leave an orphaned GHL user if the Supabase side failed.
    await deleteUser(ghlUser.id).catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
