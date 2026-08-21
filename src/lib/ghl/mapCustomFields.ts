import { ALL_PORTAL_FIELDS, type PortalFieldKey } from "./constants";
import type { GhlCustomField } from "./types";

const ID_TO_KEY = new Map<string, PortalFieldKey>(
  (Object.entries(ALL_PORTAL_FIELDS) as [PortalFieldKey, { id: string }][]).map(([key, f]) => [f.id, key])
);

// Picks just the portal-relevant custom fields out of a GHL contact's full
// customFields array and keys them by our friendly names for easy display/storage.
export function mapCustomFieldsToPortalKeys(customFields: GhlCustomField[] | undefined) {
  const out: Partial<Record<PortalFieldKey, unknown>> = {};
  for (const cf of customFields ?? []) {
    const key = ID_TO_KEY.get(cf.id);
    if (key) out[key] = cf.value;
  }
  return out;
}
