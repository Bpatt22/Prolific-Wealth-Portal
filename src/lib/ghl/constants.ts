export const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID!;
export const GHL_PIPELINE_ID = process.env.GHL_PIPELINE_ID!;

// Stages of the "Prolific Wealth Group" pipeline, in board order.
export const PIPELINE_STAGES = [
  { id: "d3b27f7d-1a74-4c67-9042-0b2a16500a91", name: "New Lead – Opted In" },
  { id: "e64bf857-cb0c-4c20-8c21-495e79bc1a48", name: "VSL1 Clicked" },
  { id: "6da6657e-ff42-4ca7-a72c-b6c1bdc289b9", name: "Application Started" },
  { id: "d00872bc-2a53-4350-b5f6-7ae000324010", name: "Application Completed" },
  { id: "f713c5df-4218-4da5-9a7d-156ae226cfae", name: "Call Booked" },
  { id: "f352c61a-1acb-4f29-9de6-ead55f8a9cf2", name: "No-Show" },
  { id: "72205c90-cb7b-4ca9-aea9-b1c533cb1d35", name: "Call Completed – Not Closed" },
  { id: "7f5a3dcc-f78a-46a9-8c9e-17e90bd75fa3", name: "Won" },
  { id: "e6f014af-5967-494e-872c-4f6aa49e5151", name: "Lost / Disqualified" },
] as const;

// Custom field IDs, pulled live from GHL "Prolific health group" custom fields folder.
export const EDITABLE_FIELDS = {
  fundingApproved: { id: "OVqRNjFie6GRzuaDud8O", label: "Funding Approved", type: "RADIO", options: ["Yes", "No"] },
  fundingAmount: { id: "9fk676yH3VBHEajISd7y", label: "Funding Amount", type: "NUMERICAL" },
  amountPaidToReferrer: { id: "uZGMMO3NxVYDkJFHkbhc", label: "Amount paid to Referrer?", type: "SINGLE_OPTIONS", options: ["Yes", "Not yet"] },
} as const;

export const VIEW_ONLY_FIELDS = {
  revenueBand: { id: "IAgBiJ7LA5LReHQm2stm", label: "Revenue Band" },
  creditBand: { id: "Vy2vDl4LeU8p4HyvAxqE", label: "Credit Band" },
  fundingTimeline: { id: "k7x31eCys4SEHHfRte4x", label: "Funding Timeline" },
  willingAndAble: { id: "9mbQ93uvq9CggafZvsSH", label: "Willing & Able" },
  constraintDescription: { id: "1Up86IqsRvcIol6iRoc8", label: "Constraint Description" },
  timeInBusiness: { id: "xhpjGBO0hCIHdlrToHty", label: "Time in the Business" },
  constraintClarity: { id: "omoMbpWratoI32rUGINn", label: "Constraint Clarity" },
  constraintType: { id: "fyNi0v3fTtjnc6VfbS5x", label: "Constraint Type" },
  leadScore: { id: "yZrlRkb7q0GBV9SBxEHe", label: "Lead Score" },
  dqReason: { id: "5jzJ9Eh3wf7bjQ5iKOJS", label: "DQ Reason" },
  kickoffCallDate: { id: "T5XMdm02McqU46C3hXiP", label: "Kickoff Call Date" },
  day90Date: { id: "upe5DUELtzM7sPuyPntF", label: "Day 90 Date" },
  prolificCut: { id: "l1j4aI98MERmUfJKqoga", label: "Prolific Cut" },
  prolificCutPaid: { id: "aPplBXam8U3EtDmVmHwZ", label: "Prolific cut paid?" },
} as const;

export const ALL_PORTAL_FIELDS = { ...EDITABLE_FIELDS, ...VIEW_ONLY_FIELDS };

export const CONSTRAINT_TYPE_OPTIONS = [
  "Sales Team",
  "Equipment",
  "Ad Spend",
  "Key Man Risk",
  "Systems & Automation",
  "Credit",
] as const;

export const EDITABLE_FIELD_IDS: Set<string> = new Set(
  Object.values(EDITABLE_FIELDS).map((f): string => f.id)
);

export type PortalFieldKey = keyof typeof ALL_PORTAL_FIELDS;
