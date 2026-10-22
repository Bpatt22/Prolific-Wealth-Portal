import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";

export type Affiliate = {
  id: string;
  authUserId: string;
  name: string;
  email: string;
  site: string;
};

// Resolves the logged-in Supabase auth user to their affiliate row. Unlike
// getCurrentTeamMember, there's no owner bypass here — every affiliate is
// scoped the same way, by name match against "Referred By?" (see
// canAffiliateAccessContact).
export async function getCurrentAffiliate(): Promise<Affiliate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabaseAdmin
    .from("affiliates")
    .select("id, auth_user_id, name, email, site")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`No affiliates row found for ${user.email}. An owner needs to add this affiliate first.`);
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    email: data.email,
    site: data.site,
  };
}
