import { ghl } from "./client";
import { GHL_COMPANY_ID, GHL_LOCATION_ID } from "./constants";

export type GhlUser = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
};

// Creates a real GHL User (staff account) with GHL's full default permission
// set for a location-level user — the same as adding one manually in GHL.
export function createUser(input: { firstName: string; lastName: string; email: string }) {
  return ghl.post<GhlUser>("/users/", {
    companyId: GHL_COMPANY_ID,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    type: "account",
    role: "user",
    locationIds: [GHL_LOCATION_ID],
  });
}

export function deleteUser(userId: string) {
  return ghl.delete<unknown>(`/users/${userId}`);
}
