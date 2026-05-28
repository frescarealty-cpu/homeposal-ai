import { PlaceOwnerHelloBanner } from "@/components/PlaceOwnerHelloBanner";

type OwnerAlertBannerProps = {
  ownerInquiryPhone?: string;
  className?: string;
  defaultExpanded?: boolean;
  autoCollapseMs?: number;
};

/** Guardian-style owner hello banner for property and proposal views. */
export function OwnerAlertBanner({
  ownerInquiryPhone = "760-123-4560",
  className = "",
  defaultExpanded = true,
  autoCollapseMs = 0,
}: OwnerAlertBannerProps) {
  return (
    <PlaceOwnerHelloBanner
      ownerInquiryPhone={ownerInquiryPhone}
      className={className}
      defaultExpanded={defaultExpanded}
      autoCollapseMs={autoCollapseMs}
      headline="Are you the owner and want more information on a proposal?"
      body=""
      collapsedPrimaryLabel="Contact Us"
    />
  );
}
