"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { PlaceOwnerHelloBanner } from "@/components/PlaceOwnerHelloBanner";

/** Mobile hello banner (bottom of screen) on /place pages only. */
export function PlacePageHelloBanner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (pathname !== "/place" || !address?.trim() || !lat || !lng) {
    return null;
  }

  return (
    <PlaceOwnerHelloBanner
      ownerInquiryPhone="760-123-4560"
      pinToViewport
      pinToViewportMinWidth={0}
      pinToViewportMaxWidth={1024}
      defaultExpanded={false}
      autoCollapseMs={10000}
      className="lg:hidden"
    />
  );
}
