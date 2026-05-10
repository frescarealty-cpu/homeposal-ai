import { useState, useEffect } from "react";
import Image from "next/image";
import { MapPin, Clock } from "lucide-react";

export type PropertyCardData = {
  id: string;
  address: string;
  city: string;
  state: string;
  imageUrl: string;
  currentBestOfferCents: number;
  pendingOfferCount: number;
  offerDeadline: string;
  status: "open" | "pending" | "closed";
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatTimeRemaining(deadline: string) {
  const end = new Date(deadline);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return "Ended";
}

function TimeRemaining({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  useEffect(() => {
    setTimeLeft(formatTimeRemaining(deadline));
  }, [deadline]);
  return <>{timeLeft ?? "—"}</>;
}

export function PropertyCard({
  property,
  onSelect,
}: {
  property: PropertyCardData;
  onSelect?: () => void;
}) {
  const statusClass =
    property.status === "open"
      ? "badge-open"
      : property.status === "closed"
        ? "badge-closed"
        : "badge-pending";

  const fullAddress = `${property.address}, ${property.city}, ${property.state}`;

  const cardBody = (
    <>
      <div className="relative h-24 w-28 shrink-0 overflow-hidden sm:h-28 sm:w-32">
        <Image
          src={property.imageUrl}
          alt={property.address}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 112px, 128px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <div>
          <span className={`mb-1 inline-block ${statusClass}`}>
            {property.status === "open" ? "Open for Offers" : property.status}
          </span>
          <p className="truncate text-sm font-medium text-[var(--foreground)]">
            {property.address}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-[var(--foreground-muted)]">
            <MapPin className="h-3 w-3 shrink-0" />
            {property.city}, {property.state}
          </p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Current Best Proposal</p>
            <p className="font-tabular text-sm font-semibold text-[var(--success)]">
              {formatCurrency(property.currentBestOfferCents)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
            <Clock className="h-3 w-3" />
            <TimeRemaining deadline={property.offerDeadline} />
          </div>
        </div>
      </div>
    </>
  );

  const navToProperty = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/property/${property.id}`;
  };

  if (onSelect) {
    return (
      <div className="group kalshi-border kalshi-border-subtle flex flex-col overflow-hidden rounded-md bg-[var(--card-bg)] transition-colors hover:border-[var(--border)]">
        <button
          type="button"
          onClick={onSelect}
          title={fullAddress}
          className="flex flex-1 min-w-0 text-left"
        >
          {cardBody}
        </button>
        <a
          href={`/property/${property.id}`}
          onClick={navToProperty}
          className="block w-full border-t border-[var(--border)] px-3 py-2 text-center text-xs font-medium text-[var(--success)] hover:bg-[var(--success)]/10"
        >
          Make Proposal
        </a>
      </div>
    );
  }

  return (
    <a
      href={`/property/${property.id}`}
      onClick={navToProperty}
      title={fullAddress}
      className="group kalshi-border kalshi-border-subtle flex cursor-pointer overflow-hidden rounded-md bg-[var(--card-bg)] transition-colors hover:border-[var(--border)] no-underline [&_p]:text-inherit"
    >
      {cardBody}
      <span className="sr-only">View property and make offer</span>
    </a>
  );
}
