import { redirect } from "next/navigation";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import InviteForm from "./invite-form";

type TeamMemberRow = { id: string; auth_user_id: string; ghl_user_id: string; name: string | null; email: string };

export default async function TeamPage() {
  const member = await getCurrentTeamMember();
  if (!member.isOwner) redirect("/dashboard");

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("id, auth_user_id, ghl_user_id, name, email")
    .order("email");
  if (error) throw error;

  const rows = data ?? [];
  const statuses = await Promise.all(
    rows.map(async (r) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(r.auth_user_id);
      return authUser.user?.last_sign_in_at ? "Active" : "Invited";
    })
  );

  return (
    <section>
      <div className="section-head">
        <h2>Team</h2>
        <p>Add a team member to give them their own scoped view of the portal</p>
      </div>

      <InviteForm />

      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="cell-primary">{r.name ?? "—"}</td>
                <td>{r.email}</td>
                <td>
                  <span className={`badge ${statuses[i] === "Active" ? "badge-green" : "badge-amber"}`}>{statuses[i]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="empty-state">
          <div className="t">No team members yet</div>
          <div className="d">Add one above to get started.</div>
        </div>
      )}
    </section>
  );
}
