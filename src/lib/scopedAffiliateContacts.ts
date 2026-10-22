import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { normalizeAffiliateName } from "./ghl/constants";
import type { Affiliate } from "./affiliateAuth";

type MirrorRow = {
  ghl_contact_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  date_updated: string | null;
  custom_fields: Record<string, unknown> | null;
};

// The contacts mirror only ever holds Main-tagged contacts (see
// upsertContactMirror), so the tag gate is already satisfied by anything
// that shows up here — matching is reduced to just the name comparison.
// Done in JS rather than a SQL filter so the trim/case-insensitive
// normalization (normalizeAffiliateName) stays in one place.
export async function listAffiliateContacts(affiliate: Affiliate): Promise<MirrorRow[]> {
  const { data, error } = await supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id, first_name, last_name, email, phone, tags, date_updated, custom_fields")
    .order("date_updated", { ascending: false })
    .returns<MirrorRow[]>();
  if (error) throw error;

  const target = normalizeAffiliateName(affiliate.name);
  return (data ?? []).filter((c) => normalizeAffiliateName(c.custom_fields?.referredBy as string | undefined) === target);
}
