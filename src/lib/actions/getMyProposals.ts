"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type MyProposal = {
  id: string;
  type: "property";
  property_id: string;
  offer_amount_cents: number;
  financing_type: string;
  closing_date: string;
  desired_days_to_close: number | null;
  status: string;
  full_notes: string | null;
  loan_amount_cents: number | null;
  loan_type: string | null;
  down_payment_cents: number | null;
  proof_of_funds: boolean | null;
  prequal_letter: boolean | null;
  created_at: string;
};

export type MyPlaceProposal = {
  id: string;
  type: "place";
  place_address: string;
  place_lat: number;
  place_lng: number;
  offer_amount_cents: number;
  financing_type: string;
  closing_date: string;
  desired_days_to_close: number | null;
  status: string;
  full_notes: string | null;
  loan_amount_cents: number | null;
  loan_type: string | null;
  down_payment_cents: number | null;
  proof_of_funds: boolean | null;
  prequal_letter: boolean | null;
  created_at: string;
};

export type MyProposalsResult =
  | { success: true; proposals: MyProposal[]; placeProposals: MyPlaceProposal[] }
  | { success: false; error: string };

/**
 * Fetch current user's proposals (property + place). Redirects to login if not authenticated.
 */
export async function getMyProposals(): Promise<MyProposalsResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login?redirect=/dashboard");
  }

  const [proposalsRes, placeRes] = await Promise.all([
    supabase
      .from("proposals")
      .select("id, property_id, offer_amount_cents, financing_type, closing_date, desired_days_to_close, status, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("place_proposals")
      .select("id, place_address, place_lat, place_lng, offer_amount_cents, financing_type, closing_date, desired_days_to_close, status, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  if (proposalsRes.error) {
    return { success: false, error: proposalsRes.error.message };
  }
  if (placeRes.error) {
    return { success: false, error: placeRes.error.message };
  }

  const proposals: MyProposal[] = (proposalsRes.data ?? []).map((r) => ({
    id: r.id,
    type: "property",
    property_id: r.property_id,
    offer_amount_cents: r.offer_amount_cents,
    financing_type: r.financing_type,
    closing_date: r.closing_date,
    desired_days_to_close: r.desired_days_to_close ?? null,
    status: r.status,
    full_notes: r.full_notes ?? null,
    loan_amount_cents: r.loan_amount_cents ?? null,
    loan_type: r.loan_type ?? null,
    down_payment_cents: r.down_payment_cents ?? null,
    proof_of_funds: r.proof_of_funds ?? null,
    prequal_letter: r.prequal_letter ?? null,
    created_at: r.created_at,
  }));

  const placeProposals: MyPlaceProposal[] = (placeRes.data ?? []).map((r) => ({
    id: r.id,
    type: "place",
    place_address: r.place_address,
    place_lat: r.place_lat,
    place_lng: r.place_lng,
    offer_amount_cents: r.offer_amount_cents,
    financing_type: r.financing_type,
    closing_date: r.closing_date,
    desired_days_to_close: r.desired_days_to_close ?? null,
    status: r.status,
    full_notes: r.full_notes ?? null,
    loan_amount_cents: r.loan_amount_cents ?? null,
    loan_type: r.loan_type ?? null,
    down_payment_cents: r.down_payment_cents ?? null,
    proof_of_funds: r.proof_of_funds ?? null,
    prequal_letter: r.prequal_letter ?? null,
    created_at: r.created_at,
  }));

  return { success: true, proposals, placeProposals };
}
