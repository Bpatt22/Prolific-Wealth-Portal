import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamMember } from "@/lib/auth";
import { createContact } from "@/lib/ghl/contacts";
import { createOpportunity } from "@/lib/ghl/opportunities";
import { upsertContactMirror, upsertOpportunityMirror } from "@/lib/sync";
import { PIPELINE_STAGES } from "@/lib/ghl/constants";

const FIRST_STAGE_ID = PIPELINE_STAGES[0].id;

// Creates a real GHL contact, assigns it to the current user, and opens an
// opportunity for it at the first pipeline stage — the portal's "Add lead" action.
export async function POST(req: NextRequest) {
  const member = await getCurrentTeamMember();
  const body = (await req.json()) as {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
    fundingAsk?: number;
    source?: string;
  };

  if (!body.firstName?.trim() && !body.lastName?.trim() && !body.companyName?.trim()) {
    return NextResponse.json({ error: "Provide at least a name or company" }, { status: 400 });
  }

  const contact = await createContact({
    firstName: body.firstName?.trim() || undefined,
    lastName: body.lastName?.trim() || undefined,
    companyName: body.companyName?.trim() || undefined,
    email: body.email?.trim() || undefined,
    phone: body.phone?.trim() || undefined,
    source: body.source?.trim() || "Prolific Portal",
    assignedTo: member.ghlUserId,
  });
  await upsertContactMirror(contact);

  const opportunityName =
    contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.companyName || "New lead";

  const opportunity = await createOpportunity({
    name: opportunityName,
    contactId: contact.id,
    pipelineStageId: FIRST_STAGE_ID,
    monetaryValue: body.fundingAsk && body.fundingAsk > 0 ? body.fundingAsk : undefined,
    assignedTo: member.ghlUserId,
  });
  await upsertOpportunityMirror(opportunity);

  return NextResponse.json({ ok: true, contact, opportunity });
}
