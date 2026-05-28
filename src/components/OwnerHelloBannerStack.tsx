"use client";

import { PlaceOwnerHelloBanner } from "@/components/PlaceOwnerHelloBanner";

export const OWNER_HELLO_BODY =
  "See bona fide proposals from verified suitors before you deal with the stress of the MLS.";

type OwnerHelloBannerStackProps = {
  body?: string;
  headline?: string;
  alertLabel?: string;
  ownerInquiryPhone?: string;
  /** Desktop banner starts expanded (home map view). */
  defaultExpandedDesktop?: boolean;
  /** Shorter banner for property / address detail views. */
  compact?: boolean;
};

/** Viewport-pinned owner hello banner (desktop + mobile), matching the home index experience. */
export function OwnerHelloBannerStack({
  body = OWNER_HELLO_BODY,
  headline,
  alertLabel,
  ownerInquiryPhone,
  defaultExpandedDesktop = true,
  compact = false,
}: OwnerHelloBannerStackProps) {
  const size = compact ? "compact" : "default";

  return (
    <>
      <PlaceOwnerHelloBanner
        pinToViewport
        pinToViewportMinWidth={768}
        defaultExpanded={defaultExpandedDesktop}
        autoCollapseMs={defaultExpandedDesktop ? 12000 : 10000}
        body={body}
        headline={headline}
        alertLabel={alertLabel}
        ownerInquiryPhone={ownerInquiryPhone}
        size={size}
      />
      <PlaceOwnerHelloBanner
        pinToViewport
        pinToViewportMinWidth={0}
        pinToViewportMaxWidth={768}
        defaultExpanded={false}
        autoCollapseMs={10000}
        body={body}
        headline={headline}
        alertLabel={alertLabel}
        ownerInquiryPhone={ownerInquiryPhone}
        size={size}
        className="md:hidden"
      />
    </>
  );
}
