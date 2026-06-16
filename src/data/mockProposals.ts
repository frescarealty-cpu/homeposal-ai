import type { ProposalPublic } from "@/types/proposals";

/**
 * Mock proposals for development — matches public shape only.
 * Replace with API/Supabase fetch in production.
 */
export const MOCK_PROPOSALS_BY_PROPERTY: Record<string, ProposalPublic[]> = {
  "1": [
    {
      id: "p1",
      offerDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priceCents: 57500000,
      financingType: "cash",
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      docsVerified: true,
    },
    {
      id: "p2",
      offerDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      priceCents: 56000000,
      financingType: "conventional",
      closingDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      docsVerified: true,
    },
    {
      id: "p3",
      offerDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      priceCents: 55000000,
      financingType: "fha",
      closingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      docsVerified: true,
    },
  ],
  "2": [
    {
      id: "p4",
      offerDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      priceCents: 61200000,
      financingType: "conventional",
      closingDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      docsVerified: true,
    },
    {
      id: "p5",
      offerDate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      priceCents: 60000000,
      financingType: "cash",
      closingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      docsVerified: true,
    },
  ],
};

export function getMockProposalsPublic(propertyId: string): ProposalPublic[] {
  return MOCK_PROPOSALS_BY_PROPERTY[propertyId] ?? [];
}
