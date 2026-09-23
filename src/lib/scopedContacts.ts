import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { TeamMember } from "./auth";

// Returns the GHL contact ids this member is scoped to, or null for an owner
// (meaning "don't filter — see everything"). Callers pass this to `.in(...)`
// only when it's non-null. Used for things scoped by owner alone (e.g. the
// Funding/Referral ledgers) — NOT for opportunities, see getVisibleContactIds.
export async function getScopedContactIds(member: TeamMember): Promise<string[] | null> {
  if (member.isOwner) return null;

  const { data, error } = await supabaseAdmin.from("contacts").select("ghl_contact_id").eq("owner_id", member.ghlUserId);
  if (error) throw error;
  return (data ?? []).map((c) => c.ghl_contact_id);
}

// Always returns a real list of contact ids (never null) — owners get every
// contact currently in the mirror (which only ever holds "Main"-tagged
// contacts), team members get their own subset of those. Use this wherever
// "owner sees everything" would otherwise skip the contacts join entirely
// and let an opportunity for a non-"Main" contact slip through, e.g. the
// pipeline board.
export async function getVisibleContactIds(member: TeamMember): Promise<string[]> {
  let query = supabaseAdmin.from("contacts").select("ghl_contact_id");
  if (!member.isOwner) query = query.eq("owner_id", member.ghlUserId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c) => c.ghl_contact_id);
}
