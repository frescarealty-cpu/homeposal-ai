"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { SearchAISection, type PlaceResult } from "./SearchAISection";
import { MapSection } from "./MapSection";
import { ProposalsPublicView } from "./ProposalsPublicView";
import { PlaceOfferForm } from "./PlaceOfferForm";
import { ZillowZestimatePanel } from "./ZillowZestimatePanel";
import { AiAssistant } from "./AiAssistant";
import { OwnerHelloBannerStack } from "./OwnerHelloBannerStack";
import { filterPropertiesByQuery, filterPropertiesNearLocation } from "@/lib/searchProperties";
import { getMockProposalsPublic } from "@/data/mockProposals";
import { createClient } from "@/lib/supabase/client";
import type { PropertyListing } from "@/data/properties";
import {
  Eye,
  Sparkles,
  ShieldCheck,
  ArrowRightLeft,
  MapPin,
  Handshake,
  MousePointerClick,
  Megaphone,
} from "lucide-react";

type HomeContentProps = {
  properties: PropertyListing[];
  initialSearch?: string;
  countySlug?: string;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const NOTICE = (
  <div className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
    <p className="mb-2">
      <strong className="text-[var(--foreground)]">Notice:</strong> This property is not currently listed for sale by the owner on this platform. The values shown are independent proposals. To ensure transparency, every proposal is vetted for authenticity—including the verification of proof of funds and pre-approval documentation—before appearing on this page. HomePosal does not represent the owner and has not been solicited to market this property.
    </p>
    <p>
      <strong className="text-[var(--foreground)]">Note to Interested Parties &amp; Owners:</strong> If this property is active with a licensed brokerage, please notify us. Once verified, we will direct all interested parties to the official listing and agent to maintain industry protocols.
    </p>
  </div>
);

export function HomeContent({ properties, initialSearch = "", countySlug }: HomeContentProps) {
  const router = useRouter();
  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useGoogleMaps();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [addressToShow, setAddressToShow] = useState<PlaceResult | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const mobileMapRef = useRef<HTMLDivElement>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileLayout(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePlaceSelect = useCallback(
    (place: PlaceResult) => {
      if (isMobileLayout) {
        if (place.isStreetSearch) {
          setSearchQuery(place.address);
          setAddressToShow(place);
          setSelectedPropertyId(null);
          requestAnimationFrame(() => {
            mobileMapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
          return;
        }
        router.push(`/place?address=${encodeURIComponent(place.address)}&lat=${place.lat}&lng=${place.lng}`);
        return;
      }
      setSearchQuery(place.address);
      setAddressToShow(place);
      setSelectedPropertyId(null);
    },
    [router, isMobileLayout]
  );

  const handlePropertySelect = useCallback((property: PropertyListing) => {
    setSelectedPropertyId(property.id);
    setAddressToShow(null);
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`;
    setSearchQuery(fullAddress);
    requestAnimationFrame(() => {
      rightPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const handleMobileStreetMapPropertySelect = useCallback(
    (property: PropertyListing) => {
      router.push(`/property/${property.id}`);
    },
    [router]
  );

  const handlePopupClose = () => {
    setSelectedPropertyId(null);
    setAddressToShow(null);
  };

  const handleNavigateToProperty = useCallback((property: PropertyListing) => {
    router.push(`/property/${property.id}`);
  }, [router]);

  const filteredProperties = filterPropertiesByQuery(searchQuery, properties);
  const showMobileStreetMap = isMobileLayout && Boolean(addressToShow?.isStreetSearch);
  const mobileMapProperties = useMemo(() => {
    if (!addressToShow?.isStreetSearch) return filteredProperties;
    const nearby = filterPropertiesNearLocation(
      properties,
      addressToShow.lat,
      addressToShow.lng
    );
    return nearby.length > 0 ? nearby : filteredProperties;
  }, [addressToShow, properties, filteredProperties]);
  const selectedProperty = selectedPropertyId ? properties.find((p) => p.id === selectedPropertyId) ?? null : null;
  const proposals = selectedPropertyId ? getMockProposalsPublic(selectedPropertyId) : [];
  const bestOfferCents = proposals.length > 0 ? Math.max(...proposals.map((p) => p.priceCents)) : 0;

  const showOwnerHello = !selectedProperty;

  return (
    <>
      {showOwnerHello && (
        <OwnerHelloBannerStack
          defaultExpandedDesktop={!addressToShow}
          compact={Boolean(addressToShow)}
        />
      )}
      <div className="flex min-w-0 min-h-0 flex-col lg:h-[calc(100vh-3.5rem)] lg:flex-row">
        <div className="flex min-w-0 h-auto w-full shrink-0 flex-col md:h-[70vh] lg:h-full lg:w-[60%]">
          <div className="shrink-0 w-full border-b border-[var(--border)] py-2">
            <SearchAISection
              value={searchQuery}
              onChange={setSearchQuery}
              onPlaceSelect={handlePlaceSelect}
              onPropertySelect={handlePropertySelect}
              onNavigateToProperty={handleNavigateToProperty}
              properties={properties}
              filteredProperties={filteredProperties}
              isLoaded={isMapsLoaded}
            />
          </div>
          <div className="relative hidden min-h-[50vh] min-w-0 flex-1 overflow-hidden pb-4 md:block">
            {!isMobileLayout && (
              <MapSection
                properties={filteredProperties}
                allProperties={properties}
                selectedPropertyId={selectedPropertyId}
                onPropertySelect={handlePropertySelect}
                onPlaceSelect={handlePlaceSelect}
                onPopupClose={handlePopupClose}
                addressToShow={addressToShow}
                isLoaded={isMapsLoaded}
                loadError={mapsLoadError}
                countySlug={countySlug}
              />
            )}
          </div>

          {showMobileStreetMap && (
            <div
              ref={mobileMapRef}
              className="relative h-[50vh] w-full min-w-0 overflow-hidden border-b border-[var(--border)] md:hidden"
            >
              {!isMapsLoaded ? (
                <div className="flex h-full items-center justify-center bg-[var(--background-elevated)]">
                  <p className="text-sm text-[var(--foreground-muted)]">Loading map…</p>
                </div>
              ) : mapsLoadError ? (
                <div className="flex h-full items-center justify-center bg-[var(--background-elevated)] p-4 text-center">
                  <p className="text-sm text-[var(--foreground-muted)]">Failed to load map</p>
                </div>
              ) : (
                <MapSection
                  key={addressToShow?.address ?? "mobile-street-map"}
                  properties={mobileMapProperties}
                  allProperties={properties}
                  selectedPropertyId={null}
                  onPropertySelect={handleMobileStreetMapPropertySelect}
                  onPlaceSelect={handlePlaceSelect}
                  onPopupClose={handlePopupClose}
                  addressToShow={addressToShow}
                  isLoaded={isMapsLoaded}
                  loadError={mapsLoadError}
                  countySlug={countySlug}
                />
              )}
              <p className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 px-3 text-center text-xs text-[var(--foreground-muted)]">
                Tap a blue pin to open that property. Pinch and drag to explore the street.
              </p>
            </div>
          )}
        </div>

        <div
          ref={rightPanelRef}
          className="flex min-w-0 w-full shrink-0 flex-col lg:h-full lg:w-[40%] border-t lg:border-t-0 lg:border-l border-[var(--border)]"
        >
          <div className="flex flex-1 flex-col overflow-y-visible p-4 lg:overflow-y-auto">
            {selectedProperty ? (
              <>
                <button
                  type="button"
                  onClick={handlePopupClose}
                  className="mb-3 self-start min-h-[44px] px-2 text-base text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  ← Back
                </button>
                <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md bg-[var(--background-elevated)]">
                  <Image
                    src={selectedProperty.imageUrls[0]}
                    alt={selectedProperty.address}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
                <span className={`mb-2 inline-block text-xs ${selectedProperty.status === "open" ? "badge-open" : selectedProperty.status === "closed" ? "badge-closed" : "badge-pending"}`}>
                  {selectedProperty.status === "open" ? "Open for Offers" : selectedProperty.status}
                </span>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">{selectedProperty.address}</h2>
                <p className="mb-3 text-sm text-[var(--foreground-muted)]">
                  {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}
                </p>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="kalshi-border rounded p-2">
                    <p className="text-xs text-[var(--foreground-muted)]">List Price</p>
                    <p className="font-tabular text-sm font-semibold">{formatCurrency(selectedProperty.listPriceCents)}</p>
                  </div>
                  <div className="kalshi-border rounded p-2">
                    <p className="text-xs text-[var(--foreground-muted)]">Beds / Baths</p>
                    <p className="font-tabular text-sm">{selectedProperty.bedrooms} / {selectedProperty.bathrooms}</p>
                  </div>
                </div>
                <div className="mb-4">{NOTICE}</div>
                <ProposalsPublicView
                  proposals={proposals}
                  listPriceCents={selectedProperty.listPriceCents}
                  bestOfferCents={bestOfferCents}
                  offerDeadline={selectedProperty.offerDeadline}
                />
                {selectedProperty.status === "open" && (
                  <div className="border-t border-[var(--border)] pt-4">
                    <PlaceOfferForm
                      propertyId={selectedProperty.id}
                      listPriceCents={selectedProperty.listPriceCents}
                      isLoggedIn={isLoggedIn}
                      redirectPath={`/property/${selectedProperty.id}#make-proposal`}
                      zillowLookupAddress={`${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state} ${selectedProperty.zipCode}`}
                      zillowLookupLat={selectedProperty.latitude}
                      zillowLookupLng={selectedProperty.longitude}
                    />
                  </div>
                )}
                <Link
                  href={`/property/${selectedProperty.id}`}
                  className="mt-4 block w-full min-h-[44px] rounded-md border border-[var(--border)] py-3 text-center text-base font-medium text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] flex items-center justify-center"
                >
                  View full property page →
                </Link>
              </>
            ) : addressToShow ? (
              <>
                <button
                  type="button"
                  onClick={handlePopupClose}
                  className="mb-3 self-start min-h-[44px] px-2 text-base text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                >
                  ← Back
                </button>
                <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">{addressToShow.address}</h2>
                <p className="mb-4 text-base text-[var(--foreground-muted)]">This address was selected from the map search.</p>
                <ZillowZestimatePanel
                  address={addressToShow.address}
                  lat={addressToShow.lat}
                  lng={addressToShow.lng}
                  variant="collapsible"
                  className="mb-4"
                />
                <div className="mb-4">{NOTICE}</div>
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/place?address=${encodeURIComponent(addressToShow.address)}&lat=${addressToShow.lat}&lng=${addressToShow.lng}#make-proposal`}
                    className="block w-full min-h-[44px] rounded-md bg-[var(--success)] py-3 text-center text-base font-medium text-white hover:opacity-90 flex items-center justify-center"
                  >
                    Make Proposal
                  </Link>
                  <Link
                    href={`/place?address=${encodeURIComponent(addressToShow.address)}&lat=${addressToShow.lat}&lng=${addressToShow.lng}`}
                    className="block w-full min-h-[44px] rounded-md border border-[var(--border)] py-3 text-center text-base font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)] flex items-center justify-center"
                  >
                    View Proposals
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <AiAssistant />

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
                    <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">What is HomePosal?</h2>

                    <p className="mb-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
                      <strong className="text-[var(--foreground)]">HomePosal:</strong> HomePosal is a public bulletin
                      board where Southern California owners view market interest and suitors submit proposals on
                      any property. We connect owners and the Interested Party so they can find each other.
                    </p>

                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">For Owners:</h3>
                      <ul className="mb-4 space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                        <li className="flex items-start gap-2">
                          <Eye className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">No Account Needed:</strong> View active
                            proposals on your property instantly without signing up.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <Sparkles className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">Verified Interest:</strong> See real,
                            unsolicited proposals from independent parties even if you aren&apos;t listed for sale.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <Megaphone className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">Invite Proposals:</strong> Want to test the
                            market? Request a &ldquo;Proposal Window.&rdquo; We&apos;ll notify the public via social media and a
                            professional yard sign while you stay in control.{" "}
                            <Link
                              href="/how-it-works#owners-option-b-invite-proposals"
                              className="whitespace-nowrap font-semibold text-[var(--success)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:underline"
                            >
                              Learn more
                            </Link>
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <MousePointerClick className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">You&apos;re in Control:</strong> We won&apos;t
                            contact you. If a proposal interests you, reach out to us for a formal presentation.
                          </p>
                        </li>
                      </ul>

                      <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">For Suitors:</h3>
                      <ul className="space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                        <li className="flex items-start gap-2">
                          <MapPin className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">Submit Anywhere:</strong> Make a proposal on
                            any Southern California property.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <ShieldCheck className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">Serious Proposals Only:</strong> We only
                            contact you to verify proof of funds, ensuring all interest is bona fide.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRightLeft className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">Direct Connections:</strong> If an owner is
                            interested, we&apos;ll reach out to facilitate the deal.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <Handshake className="mt-[2px] h-4 w-4 shrink-0 text-[var(--foreground-muted)]" />
                          <p>
                            <strong className="text-[var(--foreground)]">Respecting Listings:</strong> If a property is
                            already listed, we provide the agent&apos;s details to respect existing agreements.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
