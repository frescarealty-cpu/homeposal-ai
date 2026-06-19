"use client";

import { PropertyMarketSnapshotStrip } from "@/components/PropertyMarketSnapshotStrip";
import { useZillowZestimate } from "@/hooks/useZillowZestimate";

type PropertyMobileZestimateSectionProps = {
  address: string;
  lat?: number;
  lng?: number;
  bestOfferCents: number;
  id?: string;
  className?: string;
};

/** Mobile: market snapshot with inline Zestimate details (single fetch). */
export function PropertyMobileZestimateSection({
  address,
  lat,
  lng,
  bestOfferCents,
  id,
  className = "",
}: PropertyMobileZestimateSectionProps) {
  const estimate = useZillowZestimate(address, lat, lng);

  return (
    <div id={id} className={className}>
      <PropertyMarketSnapshotStrip
        zestimateUsd={estimate.data?.zestimateUsd}
        zestimateLoading={estimate.loading}
        zestimateError={estimate.error}
        zestimateData={estimate.data}
        normalizedAddress={estimate.normalizedAddress}
        bestOfferCents={bestOfferCents}
      />
    </div>
  );
}
