import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";

export type TeamMember = {
  authUserId: string;
  ghlUserId: string;
  name: string | null;
  email: string;
  isOwner: boolean;
};

const OWNER_EMAILS = new Set(
  (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// Resolves the logged-in Supabase auth user to their mapped GHL user id.
// This mapping is what enforces "you only see what you're assigned in GHL" —
// it must exist in team_members (created by an admin when onboarding a team member).
// A user whose email is listed in OWNER_EMAILS bypasses that scoping entirely
// and sees every contact/opportunity regardless of GHL assignment.
export async function getCurrentTeamMember(): Promise<TeamMember> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("auth_user_id, ghl_user_id, name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      `No team_members mapping found for ${user.email}. An admin needs to add a row in team_members linking this account to its GHL user id.`
    );
  }

  return {
    authUserId: data.auth_user_id,
    ghlUserId: data.ghl_user_id,
    name: data.name,
    email: data.email,
    isOwner: OWNER_EMAILS.has(data.email.toLowerCase()),
  };
}
