"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendProposalWithdrawnByUserEmail } from "@/lib/sendUserProposalEmails";

export type WithdrawResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Withdraw/cancel a property proposal. Only allowed for own proposals and when status is pending or approved.
 */
export async function withdrawProposal(proposalId: string): Promise<WithdrawResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data, error } = await supabase
    .from("proposals")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data) {
    return { success: false, error: "Proposal not found or cannot be withdrawn." };
  }

  const { data: proposal } = await supabase
    .from("proposals")
    .select("offer_amount_cents, property_id")
    .eq("id", proposalId)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  if (user.email && proposal) {
    sendProposalWithdrawnByUserEmail({
      to: user.email,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "property",
      propertyId: proposal.property_id,
    }).catch(() => {});
  }
  return { success: true };
}

/**
 * Withdraw/cancel a place proposal. Only allowed for own proposals and when status is pending or approved.
 */
export async function withdrawPlaceProposal(proposalId: string): Promise<WithdrawResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data, error } = await supabase
    .from("place_proposals")
    .update({ status: "withdrawn" })
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .in("status", ["pending", "approved"])
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data) {
    return { success: false, error: "Proposal not found or cannot be withdrawn." };
  }

  const { data: proposal } = await supabase
    .from("place_proposals")
    .select("offer_amount_cents, place_address")
    .eq("id", proposalId)
    .single();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  if (user.email && proposal) {
    sendProposalWithdrawnByUserEmail({
      to: user.email,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "place",
      placeAddress: proposal.place_address ?? undefined,
    }).catch(() => {});
  }
  return { success: true };
}
