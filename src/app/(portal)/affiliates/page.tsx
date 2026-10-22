import { redirect } from "next/navigation";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import AddAffiliateForm from "./add-affiliate-form";
import AffiliateRowActions from "./affiliate-row-actions";

type AffiliateRow = { id: string; auth_user_id: string; name: string; email: string; site: string };

export default async function AffiliatesPage() {
  const member = await getCurrentTeamMember();
  if (!member.isOwner) redirect("/dashboard");

  const { data, error } = await supabaseAdmin
    .from("affiliates")
    .select("id, auth_user_id, name, email, site")
    .order("name");
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
        <h2>Affiliates</h2>
        <p>View-only portal access for referral sources — scoped by name, not GHL ownership</p>
      </div>

      <AddAffiliateForm />

      <div className="table-wrap" style={{ marginTop: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Site</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="cell-primary">{r.name}</td>
                <td>{r.email}</td>
                <td>
                  <a href={r.site} target="_blank" rel="noopener noreferrer">
                    {r.site}
                  </a>
                </td>
                <td>
                  <span className={`badge ${statuses[i] === "Active" ? "badge-green" : "badge-amber"}`}>{statuses[i]}</span>
                </td>
                <td>
                  <AffiliateRowActions id={r.id} name={r.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="empty-state">
          <div className="t">No affiliates yet</div>
          <div className="d">Add one above to get started.</div>
        </div>
      )}
    </section>
  );
}
