"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type LoginState = { error: string | null };

export async function signIn(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  // Affiliates have no team_members row — send them straight to their own
  // portal instead of /dashboard (proxy.ts would otherwise bounce them
  // there anyway on the next request, but this avoids the extra hop).
  const { data: affiliateRow } = await supabaseAdmin
    .from("affiliates")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  redirect(affiliateRow ? "/affiliate" : "/dashboard");
}
