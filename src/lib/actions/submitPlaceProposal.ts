"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendProposalNotification } from "@/lib/sendProposalNotification";
import { sendProposalSubmittedEmail } from "@/lib/sendUserProposalEmails";

export type SubmitPlaceProposalInput = {
  placeAddress: string;
  placeLat: number;
  placeLng: number;
  offerAmountCents: number;
  financingType: string;
  closingDate: string;
  acceptedTerms: boolean;
  acceptedTermsAt: string;
  desiredDaysToClose?: number | null;
  fullNotes?: string | null;
  loanAmountCents?: number | null;
  loanType?: "fixed" | "adjustable" | null;
  downPaymentCents?: number | null;
  proofOfFunds?: boolean | null;
  prequalLetter?: boolean | null;
  preferredContactMethod?: "phone" | "text" | "email" | null;
};

export type SubmitPlaceProposalResult =
  | { success: true; id: string }
  | { success: false; error: string };

export async function submitPlaceProposal(
  input: SubmitPlaceProposalInput,
  redirectTo?: string
): Promise<SubmitPlaceProposalResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const returnPath = redirectTo ?? "/";
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_verified) {
    return { success: false, error: "Please verify your email to activate your account before submitting proposals." };
  }

  const {
    placeAddress,
    placeLat,
    placeLng,
    offerAmountCents,
    financingType,
    closingDate,
    acceptedTerms,
    acceptedTermsAt,
    desiredDaysToClose,
    fullNotes,
    loanAmountCents,
    loanType,
    downPaymentCents,
    proofOfFunds,
    prequalLetter,
    preferredContactMethod,
  } = input;

  if (!placeAddress || offerAmountCents <= 0 || !financingType || !closingDate) {
    return { success: false, error: "Missing required fields" };
  }
  if (!acceptedTerms) {
    return { success: false, error: "You must accept the Notice at Collection and Terms of Use before submitting." };
  }

  const validContactMethods = ["phone", "text", "email"] as const;
  if (!preferredContactMethod || !validContactMethods.includes(preferredContactMethod)) {
    return { success: false, error: "Preferred method of contact for verification is required (Phone, Text, or Email)" };
  }

  const validFinancing = ["cash", "conventional", "fha", "va", "other"].includes(
    financingType.toLowerCase()
  );
  if (!validFinancing) {
    return { success: false, error: "Invalid financing type" };
  }

  if (loanType && loanType !== "fixed" && loanType !== "adjustable") {
    return { success: false, error: "Invalid loan type" };
  }

  if (
    (loanAmountCents != null && loanAmountCents < 0) ||
    (downPaymentCents != null && downPaymentCents < 0)
  ) {
    return { success: false, error: "Financial amounts must be non-negative" };
  }

  const { data, error } = await supabase
    .from("place_proposals")
    .insert({
      place_address: placeAddress,
      place_lat: placeLat,
      place_lng: placeLng,
      user_id: user.id,
      offer_amount_cents: offerAmountCents,
      financing_type: financingType.toLowerCase(),
      closing_date: closingDate,
      accepted_terms: true,
      accepted_terms_at: acceptedTermsAt || new Date().toISOString(),
      full_notes: fullNotes ?? null,
      loan_amount_cents: loanAmountCents ?? null,
      loan_type: loanType ?? null,
      down_payment_cents: downPaymentCents ?? null,
      proof_of_funds: proofOfFunds ?? null,
      prequal_letter: prequalLetter ?? null,
      preferred_contact_method: preferredContactMethod,
      desired_days_to_close: desiredDaysToClose ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("submitPlaceProposal error:", error);
    return { success: false, error: error.message };
  }

  try {
    await sendProposalNotification({
      offerAmountCents,
      financingType,
      closingDate,
      target: "place",
      placeAddress,
    });
  } catch (e) {
    console.error("[HomePosal] Admin proposal notification failed:", e);
  }

  if (user.email) {
    sendProposalSubmittedEmail({
      to: user.email,
      fullName: profile?.full_name ?? null,
      offerAmountCents,
      target: "place",
      placeAddress,
    }).catch(() => {});
  }

  return { success: true, id: data.id };
}
