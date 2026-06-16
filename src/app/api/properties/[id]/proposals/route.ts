import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockProposalsPublic } from "@/data/mockProposals";
import type { ProposalPublic } from "@/types/proposals";

/**
 * Public API: returns ONLY public proposal fields (offer date, price, financing, closing date).
 * Never exposes: user_id, bidder name, contact info, full_notes, status.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await params;
  if (!propertyId) {
    return NextResponse.json({ error: "Property ID required" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("get_proposals_public", {
        p_property_id: propertyId,
      });

      if (error) {
        console.error("Supabase proposals fetch error:", error);
        // Fallback to mock when RPC fails (e.g. migration not run)
        const mock = getMockProposalsPublic(propertyId);
        return NextResponse.json(mock);
      }

      const proposals: ProposalPublic[] = (data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        offerDate: String(row.offer_date),
        priceCents: Number(row.price_cents),
        financingType: String(row.financing_type ?? "conventional"),
        closingDate: String(row.closing_date).slice(0, 10),
        desiredDaysToClose: row.desired_days_to_close != null ? Number(row.desired_days_to_close) : null,
      }));

      return NextResponse.json(proposals);
    } catch {
      const mock = getMockProposalsPublic(propertyId);
      return NextResponse.json(mock);
    }
  }

  // No Supabase configured — return mock data
  const mock = getMockProposalsPublic(propertyId);
  return NextResponse.json(mock);
}
