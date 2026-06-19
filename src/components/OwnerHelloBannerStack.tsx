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
  /** Show address search in hello banner (default on home). */
  showAddressCheck?: boolean;
  /** Override auto-collapse; 0 disables. Defaults from expanded state on index. */
  autoCollapseMs?: number;
};
const DESKTOP_INDEX_AUTO_COLLAPSE_MS = 12000;
const MOBILE_INDEX_AUTO_COLLAPSE_MS = 12000;

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
  showAddressCheck = true,
  autoCollapseMs: autoCollapseMsProp,
}: OwnerHelloBannerStackProps) {
  const size = sizeProp ?? (compact ? "compact" : "default");
  const mobileStartsExpanded = defaultExpandedMobile ?? defaultExpandedDesktop;
  const desktopAutoCollapse =
    autoCollapseMsProp ?? (defaultExpandedDesktop ? DESKTOP_INDEX_AUTO_COLLAPSE_MS : 0);
  const mobileAutoCollapse =
    autoCollapseMsProp ?? (mobileStartsExpanded ? MOBILE_INDEX_AUTO_COLLAPSE_MS : 0);

  return (
    <>
      <PlaceOwnerHelloBanner
        pinToViewport
        pinToViewportMinWidth={768}
        defaultExpanded={defaultExpandedDesktop}
        autoCollapseMs={desktopAutoCollapse}
        body={body}
        headline={headline}
        alertLabel={alertLabel}
        ownerInquiryPhone={ownerInquiryPhone}
        size={size}
        showAddressCheck={showAddressCheck}
      />
      <PlaceOwnerHelloBanner
        pinToViewport
        pinToViewportMinWidth={0}
        pinToViewportMaxWidth={768}
        defaultExpanded={mobileStartsExpanded}
        autoCollapseMs={mobileAutoCollapse}
        body={body}
        headline={headline}
        alertLabel={alertLabel}
        ownerInquiryPhone={ownerInquiryPhone}
        size={size}
        showAddressCheck={showAddressCheck}
        className="md:hidden"
      />
    </>
  );
}
