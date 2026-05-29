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
  /** Mobile banner starts expanded; defaults to `defaultExpandedDesktop`. */
  defaultExpandedMobile?: boolean;
  /** Shorter banner for property / address detail views. */
  compact?: boolean;
  size?: "default" | "compact" | "cozy";
};

const DESKTOP_INDEX_AUTO_COLLAPSE_MS = 12000;
const MOBILE_INDEX_AUTO_COLLAPSE_MS = 5000;

/** Viewport-pinned owner hello banner (desktop + mobile), matching the home index experience. */
export function OwnerHelloBannerStack({
  body = OWNER_HELLO_BODY,
  headline,
  alertLabel,
  ownerInquiryPhone,
  defaultExpandedDesktop = true,
  defaultExpandedMobile,
  compact = false,
  size: sizeProp,
}: OwnerHelloBannerStackProps) {
  const size = sizeProp ?? (compact ? "compact" : "default");
  const mobileStartsExpanded = defaultExpandedMobile ?? defaultExpandedDesktop;

  return (
    <>
      <PlaceOwnerHelloBanner
        pinToViewport
        pinToViewportMinWidth={768}
        defaultExpanded={defaultExpandedDesktop}
        autoCollapseMs={
          defaultExpandedDesktop ? DESKTOP_INDEX_AUTO_COLLAPSE_MS : 10000
        }
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
        defaultExpanded={mobileStartsExpanded}
        autoCollapseMs={mobileStartsExpanded ? MOBILE_INDEX_AUTO_COLLAPSE_MS : 10000}
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
