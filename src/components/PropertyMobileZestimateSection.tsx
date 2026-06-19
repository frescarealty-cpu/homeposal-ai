"use client";

import { PropertyMarketSnapshotStrip } from "@/components/PropertyMarketSnapshotStrip";
import { ZillowZestimatePanel } from "@/components/ZillowZestimatePanel";
import { useZillowZestimate } from "@/hooks/useZillowZestimate";

type PropertyMobileZestimateSectionProps = {
  address: string;
  lat?: number;
  lng?: number;
  bestOfferCents: number;
  proposalCount: number;
  id?: string;
  className?: string;
};

/** Mobile: market snapshot + collapsible Zestimate details (single fetch). */
export function PropertyMobileZestimateSection({
  address,
  lat,
  lng,
  bestOfferCents,
  proposalCount,
  id,
  className = "",
}: PropertyMobileZestimateSectionProps) {
  const estimate = useZillowZestimate(address, lat, lng);

  return (
    <div id={id} className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
      <PropertyMarketSnapshotStrip
        zestimateUsd={estimate.data?.zestimateUsd}
        zestimateLoading={estimate.loading}
        zestimateError={estimate.error}
        bestOfferCents={bestOfferCents}
        proposalCount={proposalCount}
      />
      <ZillowZestimatePanel
        address={address}
        lat={lat}
        lng={lng}
        variant="collapsible"
        detailsOnly
        estimate={estimate}
      />
    </div>
  );
}
