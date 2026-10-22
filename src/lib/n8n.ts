import "server-only";

// Fire-and-forget notifications to n8n, which owns the actual Data Table.
// The portal never talks to the Data Table directly — this one webhook is
// the entire contract. Add and remove share the same URL; the "action"
// field is what the n8n workflow branches on to upsert vs. delete its row.
// Failures are logged, not thrown: a down/misconfigured n8n workflow should
// never block adding or removing an affiliate in the portal itself.

async function postToN8n(action: "added" | "removed", payload: Record<string, unknown>) {
  const url = process.env.N8N_AFFILIATE_WEBHOOK_URL;
  if (!url) {
    console.error(`N8N_AFFILIATE_WEBHOOK_URL is not configured — skipping "${action}" notification`);
    return;
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    if (!res.ok) {
      console.error(`n8n affiliate webhook (${action}) returned ${res.status}`, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error(`n8n affiliate webhook (${action}) failed`, err);
  }
}

export function notifyAffiliateAdded(input: { name: string; email: string; site: string }) {
  return postToN8n("added", input);
}

export function notifyAffiliateRemoved(input: { name: string; email: string }) {
  return postToN8n("removed", input);
}
