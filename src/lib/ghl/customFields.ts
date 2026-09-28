import { ghl } from "./client";
import { GHL_LOCATION_ID } from "./constants";

type GhlCustomFieldDef = { id: string; name: string };

// Full custom-field directory for the location (~378 fields) — used to
// resolve every custom field id to its human-readable name for the backup,
// unlike mapCustomFieldsToPortalKeys, which only knows about the ~17 fields
// the portal's UI actually displays. Fetched fresh each backup run so it
// stays correct even as new custom fields get added in GHL later.
export async function fetchCustomFieldNameMap(): Promise<Map<string, string>> {
  const { customFields } = await ghl.get<{ customFields: GhlCustomFieldDef[] }>(
    `/locations/${GHL_LOCATION_ID}/customFields`
  );
  return new Map(customFields.map((f) => [f.id, f.name]));
}
