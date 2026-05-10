"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendProposalApprovedEmail, sendProposalCancelledEmail } from "@/lib/sendUserProposalEmails";

/**
 * Check if the current user is an admin.
 * Set ADMIN_EMAILS in .env.local (comma-separated) e.g. ADMIN_EMAILS=admin@example.com
 */
async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return false;

  return adminEmails.includes(user.email.toLowerCase());
}

export type ApproveProposalResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin-only: approve a property proposal so it appears on the public page.
 */
export async function approveProposal(proposalId: string): Promise<ApproveProposalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("user_id, offer_amount_cents, property_id")
    .eq("id", proposalId)
    .eq("status", "pending")
    .single();

  if (!proposal) {
    return { success: false, error: "Proposal not found or already processed" };
  }

  const { error } = await supabase
    .from("proposals")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", proposal.user_id)
    .single();
  const to = profile?.email ?? null;
  if (to) {
    sendProposalApprovedEmail({
      to,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "property",
      propertyId: proposal.property_id,
    }).catch(() => {});
  }
  return { success: true };
}

export type CancelProposalResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin-only: cancel an approved (active) property proposal. Sets status to withdrawn and emails the user.
 */
export async function cancelProposal(proposalId: string): Promise<CancelProposalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("user_id, offer_amount_cents, property_id")
    .eq("id", proposalId)
    .eq("status", "approved")
    .single();

  if (!proposal) {
    return { success: false, error: "Proposal not found or not active" };
  }

  const { error } = await supabase
    .from("proposals")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("status", "approved");

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", proposal.user_id)
    .single();
  const to = profile?.email ?? null;
  if (to) {
    sendProposalCancelledEmail({
      to,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "property",
      propertyId: proposal.property_id,
      reason: "Your proposal has been removed from the board by an administrator.",
    }).catch(() => {});
  }
  return { success: true };
}

export type RejectProposalResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin-only: reject/cancel a property proposal. Sets status to withdrawn and emails the user.
 */
export async function rejectProposal(proposalId: string): Promise<RejectProposalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: proposal } = await supabase
    .from("proposals")
    .select("user_id, offer_amount_cents, property_id")
    .eq("id", proposalId)
    .eq("status", "pending")
    .single();

  if (!proposal) {
    return { success: false, error: "Proposal not found or already processed" };
  }

  const { error } = await supabase
    .from("proposals")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", proposalId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", proposal.user_id)
    .single();
  const to = profile?.email ?? null;
  if (to) {
    sendProposalCancelledEmail({
      to,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "property",
      propertyId: proposal.property_id,
      reason: "Your proposal was not approved for display on the board. You may submit a new proposal at any time.",
    }).catch(() => {});
  }
  return { success: true };
}

export type ApprovePlaceProposalResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin-only: approve a place proposal so it appears on the public page.
 */
export async function approvePlaceProposal(proposalId: string): Promise<ApprovePlaceProposalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: proposal } = await supabase
    .from("place_proposals")
    .select("user_id, offer_amount_cents, place_address")
    .eq("id", proposalId)
    .eq("status", "pending")
    .single();

  if (!proposal) {
    return { success: false, error: "Proposal not found or already processed" };
  }

  const { error } = await supabase
    .from("place_proposals")
    .update({ status: "approved" })
    .eq("id", proposalId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", proposal.user_id)
    .single();
  const to = profile?.email ?? null;
  if (to) {
    sendProposalApprovedEmail({
      to,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "place",
      placeAddress: proposal.place_address ?? undefined,
    }).catch(() => {});
  }
  return { success: true };
}

export type CancelPlaceProposalResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin-only: cancel an approved (active) place proposal. Sets status to withdrawn and emails the user.
 */
export async function cancelPlaceProposal(proposalId: string): Promise<CancelPlaceProposalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: proposal } = await supabase
    .from("place_proposals")
    .select("user_id, offer_amount_cents, place_address")
    .eq("id", proposalId)
    .eq("status", "approved")
    .single();

  if (!proposal) {
    return { success: false, error: "Proposal not found or not active" };
  }

  const { error } = await supabase
    .from("place_proposals")
    .update({ status: "withdrawn" })
    .eq("id", proposalId)
    .eq("status", "approved");

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", proposal.user_id)
    .single();
  const to = profile?.email ?? null;
  if (to) {
    sendProposalCancelledEmail({
      to,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "place",
      placeAddress: proposal.place_address ?? undefined,
      reason: "Your proposal has been removed from the board by an administrator.",
    }).catch(() => {});
  }
  return { success: true };
}

export type RejectPlaceProposalResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Admin-only: reject/cancel a place proposal. Sets status to withdrawn and emails the user.
 */
export async function rejectPlaceProposal(proposalId: string): Promise<RejectPlaceProposalResult> {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  const supabase = createAdminClient();
  const { data: proposal } = await supabase
    .from("place_proposals")
    .select("user_id, offer_amount_cents, place_address")
    .eq("id", proposalId)
    .eq("status", "pending")
    .single();

  if (!proposal) {
    return { success: false, error: "Proposal not found or already processed" };
  }

  const { error } = await supabase
    .from("place_proposals")
    .update({ status: "withdrawn" })
    .eq("id", proposalId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: error.message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", proposal.user_id)
    .single();
  const to = profile?.email ?? null;
  if (to) {
    sendProposalCancelledEmail({
      to,
      fullName: profile?.full_name ?? null,
      offerAmountCents: proposal.offer_amount_cents,
      target: "place",
      placeAddress: proposal.place_address ?? undefined,
      reason: "Your proposal was not approved for display on the board. You may submit a new proposal at any time.",
    }).catch(() => {});
  }
  return { success: true };
}
