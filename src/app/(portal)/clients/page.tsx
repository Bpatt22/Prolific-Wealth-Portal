import Link from "next/link";
import { getCurrentTeamMember } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ContactRow = {
  ghl_contact_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  tags: string[] | null;
  date_updated: string | null;
};

export default async function ClientsPage() {
  const member = await getCurrentTeamMember();

  let query = supabaseAdmin
    .from("contacts")
    .select("ghl_contact_id, first_name, last_name, email, phone, tags, date_updated")
    .order("date_updated", { ascending: false })
    .limit(1000);
  if (!member.isOwner) query = query.eq("owner_id", member.ghlUserId);

  const { data, error } = await query.returns<ContactRow[]>();

  if (error) throw error;
  const contacts = data ?? [];

  return (
    <section>
      <div className="section-head">
        <h2>Clients</h2>
        <p>
          {member.isOwner ? "Every contact" : "Every contact assigned to you"} in GHL — {contacts.length} total
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Tags</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => {
              const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed contact";
              return (
                <tr key={c.ghl_contact_id} className="clickable">
                  <td>
                    <Link href={`/contacts/${c.ghl_contact_id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div className="cell-primary">{name}</div>
                    </Link>
                  </td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>
                    {(c.tags ?? []).slice(0, 3).map((tag) => (
                      <span key={tag} className="badge badge-slate" style={{ marginRight: 4 }}>
                        {tag}
                      </span>
                    ))}
                  </td>
                  <td className="cell-sub">{c.date_updated ? new Date(c.date_updated).toLocaleDateString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contacts.length === 0 && (
        <div className="empty-state">
          <div className="t">No clients yet</div>
          <div className="d">Contacts assigned to you in GHL will show up here once synced.</div>
        </div>
      )}
    </section>
  );
}
