import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const member = await getCurrentTeamMember();
  const rawQ = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (rawQ.length < 2) return NextResponse.json({ results: [] });
  // Strip characters that are syntactically meaningful in a PostgREST filter string.
  const q = rawQ.replace(/[,()*]/g, "");
  if (q.length < 2) return NextResponse.json({ results: [] });

  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id, first_name, last_name, email, phone")
    .eq("owner_id", member.ghlUserId)
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = (data ?? []).map((c) => ({
    id: c.ghl_contact_id,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || c.phone || "Unnamed contact",
    email: c.email,
  }));

  return NextResponse.json({ results });
}
