import Link from "next/link";
import { getCurrentAffiliate } from "@/lib/affiliateAuth";
import { listAffiliateContacts } from "@/lib/scopedAffiliateContacts";

export default async function AffiliateContactsPage() {
  const affiliate = await getCurrentAffiliate();
  const contacts = await listAffiliateContacts(affiliate);

  return (
    <section>
      <div className="section-head">
        <h2>My Referrals</h2>
        <p>
          Every contact with &quot;{affiliate.name}&quot; in Referred By? — {contacts.length} total
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Last updated</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.ghl_contact_id}>
                <td className="cell-primary">
                  <Link href={`/affiliate/${c.ghl_contact_id}`}>
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unnamed contact"}
                  </Link>
                </td>
                <td>{c.email ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
                <td>{c.date_updated ? new Date(c.date_updated).toLocaleString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts.length === 0 && (
        <div className="empty-state">
          <div className="t">No referrals yet</div>
          <div className="d">Contacts with your name in Referred By? will show up here automatically.</div>
        </div>
      )}
    </section>
  );
}
