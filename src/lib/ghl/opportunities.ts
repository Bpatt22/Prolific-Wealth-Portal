import { ghl } from "./client";
import { GHL_LOCATION_ID, GHL_PIPELINE_ID } from "./constants";
import type { GhlOpportunity } from "./types";

export async function listAllOpportunities(): Promise<GhlOpportunity[]> {
  const all: GhlOpportunity[] = [];
  let startAfter: number | undefined;
  let startAfterId: string | undefined;

  for (;;) {
    const qs = new URLSearchParams({
      location_id: GHL_LOCATION_ID,
      pipeline_id: GHL_PIPELINE_ID,
      limit: "100",
    });
    if (startAfter) qs.set("startAfter", String(startAfter));
    if (startAfterId) qs.set("startAfterId", startAfterId);

    const page = await ghl.get<{
      opportunities: GhlOpportunity[];
      meta: { startAfter?: number; startAfterId?: string; nextPageUrl?: string };
    }>(`/opportunities/search?${qs.toString()}`);

    all.push(...page.opportunities);

    if (!page.meta.nextPageUrl || page.opportunities.length === 0) break;
    startAfter = page.meta.startAfter;
    startAfterId = page.meta.startAfterId;
  }

  return all;
}

export function getOpportunity(opportunityId: string) {
  return ghl.get<{ opportunity: GhlOpportunity }>(`/opportunities/${opportunityId}`).then((r) => r.opportunity);
}

export function updateOpportunityStage(opportunityId: string, pipelineStageId: string) {
  return ghl
    .put<{ opportunity: GhlOpportunity }>(`/opportunities/${opportunityId}`, { pipelineStageId })
    .then((r) => r.opportunity);
}
