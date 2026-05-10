import type { ProposalPublic } from "@/types/proposals";
import { createClient } from "@/lib/supabase/server";

/** Build address variants so we match DB regardless of "USA" suffix (e.g. map vs autocomplete). */
function addressVariants(address: string): string[] {
  const trimmed = address.trim();
  if (!trimmed) return [];
  const variants = [trimmed];
  const withoutUSA = trimmed.replace(/,?\s*USA\s*$/i, "").trim();
  if (withoutUSA && withoutUSA !== trimmed) variants.push(withoutUSA);
  const withUSA = /,\s*USA\s*$/i.test(trimmed) ? trimmed : `${trimmed}, USA`;
  if (withUSA !== trimmed && !variants.includes(withUSA)) variants.push(withUSA);
  return variants;
}

export async function getPlaceProposals(
  address: string,
  lat: number,
  lng: number
): Promise<ProposalPublic[]> {
  try {
    const supabase = await createClient();
    const variants = addressVariants(address);
    for (const pAddress of variants) {
      const { data, error } = await supabase.rpc("get_place_proposals_public", {
        p_address: pAddress,
        p_lat: lat,
        p_lng: lng,
      });

      if (error) continue;

      if (!Array.isArray(data) || data.length === 0) continue;

      return data.map((row: { id: string; offer_date: string; price_cents: number; financing_type: string; closing_date: string; desired_days_to_close?: number | null }) => ({
        id: row.id,
        offerDate: row.offer_date,
        priceCents: row.price_cents,
        financingType: row.financing_type,
        closingDate: row.closing_date,
        desiredDaysToClose: row.desired_days_to_close ?? null,
      }));
    }
    return [];
  } catch {
    return [];
  }
}
