/**
 * Public proposal fields only — safe to display without authentication.
 * Never expose: user_id, bidder name, contact info, full_notes, status.
 */
export type ProposalPublic = {
  id: string;
  offerDate: string;
  priceCents: number;
  financingType: string;
  closingDate: string;
  /** User-entered desired days to close (static, not a countdown). */
  desiredDaysToClose?: number | null;
  /**
   * Proof-of-funds / pre-approval reviewed before public display.
   * Omitted or true for proposals returned by public RPCs.
   */
  docsVerified?: boolean;
};

export function isProposalDocsVerified(proposal: ProposalPublic): boolean {
  return proposal.docsVerified !== false;
}
