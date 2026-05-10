"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MyProposal, MyPlaceProposal } from "@/lib/actions/getMyProposals";
import { sendProposalEditedEmail } from "@/lib/sendUserProposalEmails";
import { sendProposalNotification } from "@/lib/sendProposalNotification";

export type UpdateProposalInput = {
  offerAmountCents: number;
  financingType: string;
  closingDate: string;
  desiredDaysToClose?: number | null;
  fullNotes?: string | null;
  loanAmountCents?: number | null;
  loanType?: "fixed" | "adjustable" | null;
  downPaymentCents?: number | null;
  proofOfFunds?: boolean | null;
  prequalLetter?: boolean | null;
};

export type GetProposalForEditResult =
  | { success: true; proposal: MyProposal | MyPlaceProposal }
  | { success: false; error: string };

const EDITABLE_STATUSES = ["pending", "approved"];

/**
 * Fetch a single proposal by id and type for editing. Must be owned by current user and editable status.
 */
export async function getProposalForEdit(
  id: string,
  type: "property" | "place"
): Promise<GetProposalForEditResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard");
  }

  if (type === "property") {
    const { data, error } = await supabase
      .from("proposals")
      .select("id, property_id, offer_amount_cents, financing_type, closing_date, desired_days_to_close, status, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Proposal not found" };
    }
    if (!EDITABLE_STATUSES.includes(data.status)) {
      return { success: false, error: "This proposal can no longer be edited" };
    }
    const proposal: MyProposal = {
      id: data.id,
      type: "property",
      property_id: data.property_id,
      offer_amount_cents: data.offer_amount_cents,
      financing_type: data.financing_type,
      closing_date: data.closing_date,
      desired_days_to_close: data.desired_days_to_close ?? null,
      status: data.status,
      full_notes: data.full_notes ?? null,
      loan_amount_cents: data.loan_amount_cents ?? null,
      loan_type: data.loan_type ?? null,
      down_payment_cents: data.down_payment_cents ?? null,
      proof_of_funds: data.proof_of_funds ?? null,
      prequal_letter: data.prequal_letter ?? null,
      created_at: data.created_at,
    };
    return { success: true, proposal };
  }

  const { data, error } = await supabase
    .from("place_proposals")
    .select("id, place_address, place_lat, place_lng, offer_amount_cents, financing_type, closing_date, desired_days_to_close, status, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Proposal not found" };
  }
  if (!EDITABLE_STATUSES.includes(data.status)) {
    return { success: false, error: "This proposal can no longer be edited" };
  }
  const proposal: MyPlaceProposal = {
    id: data.id,
    type: "place",
    place_address: data.place_address,
    place_lat: data.place_lat,
    place_lng: data.place_lng,
    offer_amount_cents: data.offer_amount_cents,
    financing_type: data.financing_type,
    closing_date: data.closing_date,
    desired_days_to_close: data.desired_days_to_close ?? null,
    status: data.status,
    full_notes: data.full_notes ?? null,
    loan_amount_cents: data.loan_amount_cents ?? null,
    loan_type: data.loan_type ?? null,
    down_payment_cents: data.down_payment_cents ?? null,
    proof_of_funds: data.proof_of_funds ?? null,
    prequal_letter: data.prequal_letter ?? null,
    created_at: data.created_at,
  };
  return { success: true, proposal };
}

export type UpdateProposalResult =
  | { success: true }
  | { success: false; error: string };

export async function updateProposal(
  id: string,
  input: UpdateProposalInput
): Promise<UpdateProposalResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard");
  }

  const validFinancing = ["cash", "conventional", "fha", "va", "other"].includes(
    input.financingType.toLowerCase()
  );
  if (!validFinancing) {
    return { success: false, error: "Invalid financing type" };
  }
  if (
    (input.loanAmountCents != null && input.loanAmountCents < 0) ||
    (input.downPaymentCents != null && input.downPaymentCents < 0) ||
    input.offerAmountCents < 0
  ) {
    return { success: false, error: "Amounts must be non-negative" };
  }
  if (input.loanType && input.loanType !== "fixed" && input.loanType !== "adjustable") {
    return { success: false, error: "Invalid loan type" };
  }

  const { error } = await supabase
    .from("proposals")
    .update({
      offer_amount_cents: input.offerAmountCents,
      financing_type: input.financingType.toLowerCase(),
      closing_date: input.closingDate,
      desired_days_to_close: input.desiredDaysToClose ?? null,
      full_notes: input.fullNotes ?? null,
      loan_amount_cents: input.loanAmountCents ?? null,
      loan_type: input.loanType ?? null,
      down_payment_cents: input.downPaymentCents ?? null,
      proof_of_funds: input.proofOfFunds ?? null,
      prequal_letter: input.prequalLetter ?? null,
      updated_at: new Date().toISOString(),
      status: "pending",
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", EDITABLE_STATUSES);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("property_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  if (user.email && proposal?.property_id) {
    sendProposalEditedEmail({
      to: user.email,
      fullName: profile?.full_name ?? null,
      offerAmountCents: input.offerAmountCents,
      target: "property",
      propertyId: proposal.property_id,
    }).catch(() => {});
  }
  if (proposal?.property_id) {
    try {
      await sendProposalNotification({
        offerAmountCents: input.offerAmountCents,
        financingType: input.financingType,
        closingDate: input.closingDate,
        target: "property",
        propertyId: proposal.property_id,
        notificationType: "edited",
      });
    } catch (e) {
      console.error("[HomePosal] Admin edited proposal notification failed:", e);
    }
  }
  return { success: true };
}

export async function updatePlaceProposal(
  id: string,
  input: UpdateProposalInput
): Promise<UpdateProposalResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard");
  }

  const validFinancing = ["cash", "conventional", "fha", "va", "other"].includes(
    input.financingType.toLowerCase()
  );
  if (!validFinancing) {
    return { success: false, error: "Invalid financing type" };
  }
  if (
    (input.loanAmountCents != null && input.loanAmountCents < 0) ||
    (input.downPaymentCents != null && input.downPaymentCents < 0) ||
    input.offerAmountCents < 0
  ) {
    return { success: false, error: "Amounts must be non-negative" };
  }
  if (input.loanType && input.loanType !== "fixed" && input.loanType !== "adjustable") {
    return { success: false, error: "Invalid loan type" };
  }

  const { error } = await supabase
    .from("place_proposals")
    .update({
      offer_amount_cents: input.offerAmountCents,
      financing_type: input.financingType.toLowerCase(),
      closing_date: input.closingDate,
      desired_days_to_close: input.desiredDaysToClose ?? null,
      full_notes: input.fullNotes ?? null,
      loan_amount_cents: input.loanAmountCents ?? null,
      loan_type: input.loanType ?? null,
      down_payment_cents: input.downPaymentCents ?? null,
      proof_of_funds: input.proofOfFunds ?? null,
      prequal_letter: input.prequalLetter ?? null,
      updated_at: new Date().toISOString(),
      status: "pending",
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", EDITABLE_STATUSES);

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: proposal } = await supabase
    .from("place_proposals")
    .select("place_address")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  if (user.email && proposal?.place_address) {
    sendProposalEditedEmail({
      to: user.email,
      fullName: profile?.full_name ?? null,
      offerAmountCents: input.offerAmountCents,
      target: "place",
      placeAddress: proposal.place_address,
    }).catch(() => {});
  }
  if (proposal?.place_address) {
    try {
      await sendProposalNotification({
        offerAmountCents: input.offerAmountCents,
        financingType: input.financingType,
        closingDate: input.closingDate,
        target: "place",
        placeAddress: proposal.place_address,
        notificationType: "edited",
      });
    } catch (e) {
      console.error("[HomePosal] Admin edited proposal notification failed:", e);
    }
  }
  return { success: true };
}
