import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { StreetViewPanel } from "@/components/StreetViewPanel";
import { ProposalsPublicView } from "@/components/ProposalsPublicView";
import { PlaceOfferForm } from "@/components/PlaceOfferForm";
import { AiAssistant } from "@/components/AiAssistant";
import { StickyDisclosureBanner } from "@/components/StickyDisclosureBanner";
import { ZillowZestimatePanel } from "@/components/ZillowZestimatePanel";
import { getPlaceProposals } from "@/lib/placeProposals";
import { createClient } from "@/lib/supabase/server";

export default async function PlacePage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string; lat?: string; lng?: string }>;
}) {
  const { address, lat, lng } = await searchParams;

  const latNum = lat ? parseFloat(lat) : NaN;
  const lngNum = lng ? parseFloat(lng) : NaN;
  const isValid = address && !isNaN(latNum) && !isNaN(lngNum);

  const proposals = isValid ? await getPlaceProposals(address, latNum, lngNum) : [];
  const bestOfferCents = proposals.length > 0 ? Math.max(...proposals.map((p) => p.priceCents)) : 0;

  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    // Supabase not configured
  }

  const redirectPath = `/place?address=${encodeURIComponent(address ?? "")}&lat=${latNum}&lng=${lngNum}`;

  if (!isValid) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <p className="text-[var(--foreground-muted)]">
          Address and location are required. Search for an address on the map first.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--success)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back To Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      {/* Left: Place details */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:max-w-[60%]">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-base text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back To Home
        </Link>

        <h1 className="mb-2 flex items-center gap-2 text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
          <MapPin className="h-6 w-6 shrink-0 text-[var(--foreground-muted)]" />
          {address}
        </h1>
        <p className="mb-4 text-base text-[var(--foreground-muted)]">
          This address was selected from the map search.
        </p>

        <div className="mb-6">
          <StreetViewPanel
            latitude={latNum}
            longitude={lngNum}
            address={address}
          />
        </div>

        <div className="mb-6">
          <StickyDisclosureBanner />
        </div>
      </div>

      {/* Right: Proposals + Place offer form */}
      <aside id="make-proposal" className="kalshi-border flex w-full flex-col border-t lg:w-[40%] lg:min-w-[360px] lg:border-l lg:border-t-0 lg:sticky lg:top-0 lg:self-start lg:max-h-screen lg:overflow-y-auto">
        <div className="px-4 pt-4">
          <AiAssistant />
        </div>
        <div className="p-4">
          <ZillowZestimatePanel address={address} lat={latNum} lng={lngNum} variant="collapsible" />
        </div>
        <div className="border-t border-[var(--border)]" />
        <ProposalsPublicView
          proposals={proposals}
          bestOfferCents={bestOfferCents}
          enableInquiry
          inquiryAddressLabel={address}
        />
        <div className="border-t border-[var(--border)]">
          <PlaceOfferForm
            placeAddress={address}
            placeLat={latNum}
            placeLng={lngNum}
            isLoggedIn={isLoggedIn}
            redirectPath={redirectPath}
          />
        </div>
        <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4">
          <Link
            href="/"
            className="block w-full rounded-md border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)]"
          >
            Back To Home
          </Link>
        </div>
      </aside>
    </div>
  );
}
