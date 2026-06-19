import Image from "next/image";
import Link from "next/link";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { ProposalsPublicView } from "@/components/ProposalsPublicView";
import { PlaceOfferForm } from "@/components/PlaceOfferForm";
import { StreetViewPanel } from "@/components/StreetViewPanel";
import { StickyDisclosureBanner } from "@/components/StickyDisclosureBanner";
import { OwnerHelloBannerStack } from "@/components/OwnerHelloBannerStack";
import { PropertyMobileZestimateSection } from "@/components/PropertyMobileZestimateSection";
import { ZillowZestimatePanel } from "@/components/ZillowZestimatePanel";
import { MobileProposalsNudge } from "@/components/MobileProposalsNudge";
import { AiAssistant } from "@/components/AiAssistant";
import { MOCK_PROPERTIES } from "@/data/properties";
import { getMockProposalsPublic } from "@/data/mockProposals";
import { createClient } from "@/lib/supabase/server";

function getProperty(id: string) {
  return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offer?: string }>;
}) {
  const { id } = await params;
  const { offer: offerParam } = await searchParams;
  const initialOffer = offerParam ? String(Math.round(parseFloat(offerParam) * 100) / 100) : undefined;
  const property = getProperty(id);
  const proposals = getMockProposalsPublic(id);

  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // Supabase not configured
  }

  if (!property) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Property not found</p>
      </div>
    );
  }

  const statusClass =
    property.status === "open"
      ? "badge-open"
      : property.status === "closed"
        ? "badge-closed"
        : "badge-pending";

  const zillowAddress = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
  const propertyAddressHeading = (
    <>
      <span className={`mb-2 inline-block ${statusClass}`}>
        {property.status === "open" ? "Open for Offers" : property.status}
      </span>
      <h1 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{property.address}</h1>
      <p className="mt-1 mb-4 text-base text-[var(--foreground-muted)]">
        {property.city}, {property.state} {property.zipCode}
      </p>
    </>
  );
  const zestimatePanel = (
    <ZillowZestimatePanel
      address={zillowAddress}
      lat={property.latitude}
      lng={property.longitude}
      variant="collapsible"
    />
  );

  return (
    <>
      <OwnerHelloBannerStack defaultExpandedDesktop={false} compact showAddressCheck={false} />
      <div className="w-full shrink-0 px-4 pt-4 lg:hidden">
        <BackToHomeLink className="mb-4" />
        {propertyAddressHeading}
      </div>
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row lg:items-stretch">
      {/* Left: Property details (below sidebar on mobile) */}
      <div className="order-2 flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:order-1 lg:max-w-[60%]">
        <BackToHomeLink className="mb-6 hidden lg:inline-flex" />

        <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-md bg-[var(--background-elevated)]">
          <Image
            src={property.imageUrls[0]}
            alt={property.address}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>

        <span className={`mb-2 hidden lg:inline-block ${statusClass}`}>
          {property.status === "open" ? "Open for Offers" : property.status}
        </span>
        <h1 className="hidden text-xl font-semibold text-[var(--foreground)] sm:text-2xl lg:block">
          {property.address}
        </h1>
        <p className="mb-4 hidden text-base text-[var(--foreground-muted)] lg:block">
          {property.city}, {property.state} {property.zipCode}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <div className="kalshi-border rounded-md p-4">
            <p className="text-xs text-[var(--foreground-muted)]">List Price</p>
            <p className="font-tabular text-lg font-semibold">{formatCurrency(property.listPriceCents)}</p>
          </div>
          <div className="kalshi-border rounded-md p-4">
            <p className="text-xs text-[var(--foreground-muted)]">Beds / Baths</p>
            <p className="font-tabular">{property.bedrooms} / {property.bathrooms}</p>
          </div>
          <div className="kalshi-border rounded-md p-4">
            <p className="text-xs text-[var(--foreground-muted)]">Living Sq Ft</p>
            <p className="font-tabular">{property.squareFeet?.toLocaleString()}</p>
          </div>
          <div className="kalshi-border rounded-md p-4">
            <p className="text-xs text-[var(--foreground-muted)]">Lot Sq Ft</p>
            <p className="font-tabular">{property.lotSizeSqft?.toLocaleString() ?? "—"}</p>
          </div>
        </div>

        <p className="mb-4 text-[var(--foreground-muted)]">{property.description}</p>
        {property.amenities?.length > 0 && (
          <p className="mb-6 text-sm text-[var(--foreground-muted)]">
            Amenities: {property.amenities.join(", ")}
          </p>
        )}

        <div className="mb-6 hidden lg:block">
          <StreetViewPanel
            latitude={property.latitude}
            longitude={property.longitude}
            address={`${property.address}, ${property.city}, ${property.state}`}
          />
        </div>

        <div className="hidden w-full shrink-0 border-t border-[var(--border)] lg:block">
          <StickyDisclosureBanner inline className="rounded-none border-x-0 text-sm" />
        </div>

      </div>

      {/* Right: Public proposals list + Place offer (requires login) */}
      <aside
        id="make-proposal"
        className="kalshi-border order-1 flex w-full min-h-0 flex-col border-t lg:order-2 lg:w-[40%] lg:min-w-[360px] lg:border-l lg:border-t-0 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto"
      >
        <MobileProposalsNudge proposalCount={proposals.length} />
        <div className="hidden px-4 pb-4 lg:block lg:pt-4">
          <AiAssistant defaultExpandedDesktop={false} detailPageCompact />
        </div>
        <div className="hidden border-t border-[var(--border)] lg:block" />
        <div className="hidden p-4 lg:block">{zestimatePanel}</div>
        <div className="hidden border-t border-[var(--border)] lg:block" />
        <ProposalsPublicView
          proposals={proposals}
          listPriceCents={property.listPriceCents}
          bestOfferCents={property.bestOfferCents}
          offerDeadline={property.offerDeadline}
          enableInquiry
          inquiryAddressLabel={zillowAddress}
          showOwnerAlertBanner={false}
          beforeProposalsHeading={
            <div className="mb-4 flex flex-col gap-4 lg:hidden">
              <StreetViewPanel
                latitude={property.latitude}
                longitude={property.longitude}
                address={`${property.address}, ${property.city}, ${property.state}`}
              />
              <PropertyMobileZestimateSection
                id="property-zestimate"
                address={zillowAddress}
                lat={property.latitude}
                lng={property.longitude}
                bestOfferCents={property.bestOfferCents}
                proposalCount={proposals.length}
              />
            </div>
          }
          hideHighestProposalBanner
        />
        <div className="mt-auto flex flex-col">
          {property.status === "open" && (
            <div className="border-t border-[var(--border)]">
              <PlaceOfferForm
                propertyId={property.id}
                listPriceCents={property.listPriceCents}
                initialAmount={initialOffer}
                isLoggedIn={isLoggedIn}
                redirectPath={`/property/${property.id}#make-proposal`}
                zillowLookupAddress={`${property.address}, ${property.city}, ${property.state} ${property.zipCode}`}
                zillowLookupLat={property.latitude}
                zillowLookupLng={property.longitude}
              />
            </div>
          )}
          <div className="border-t border-[var(--border)] p-4 lg:hidden">
            <AiAssistant defaultExpandedDesktop={false} detailPageCompact />
          </div>
          <div className="hidden border-t border-[var(--border)] p-4 lg:block">
            <BackToHomeLink variant="button" />
          </div>
        </div>
        <div className="border-t border-[var(--border)] p-4 lg:hidden">
          <StickyDisclosureBanner inline className="text-xs sm:text-sm" />
        </div>
      </aside>
    </div>
    </>
  );
}
