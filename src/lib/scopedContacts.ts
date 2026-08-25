import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { TeamMember } from "./auth";

// Returns the GHL contact ids this member is scoped to, or null for an owner
// (meaning "don't filter — see everything"). Callers pass this to `.in(...)`
// only when it's non-null.
export async function getScopedContactIds(member: TeamMember): Promise<string[] | null> {
  if (member.isOwner) return null;

  const { data, error } = await supabaseAdmin.from("contacts").select("ghl_contact_id").eq("owner_id", member.ghlUserId);
  if (error) throw error;
  return (data ?? []).map((c) => c.ghl_contact_id);
}
