"use client";

import Image from "next/image";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatProposalUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type PropertyMarketSnapshotStripProps = {
  zestimateUsd: number | null | undefined;
  zestimateLoading?: boolean;
  zestimateError?: string | null;
  bestOfferCents: number;
  proposalCount: number;
  className?: string;
};

export function PropertyMarketSnapshotStrip({
  zestimateUsd,
  zestimateLoading = false,
  zestimateError = null,
  bestOfferCents,
  proposalCount,
  className = "",
}: PropertyMarketSnapshotStripProps) {
  const proposalLine =
    proposalCount === 0
      ? "No verified proposals on HomePosal yet"
      : proposalCount === 1
        ? "1 verified proposal on HomePosal"
        : `${proposalCount} verified proposals on HomePosal`;

  const zestimateDisplay = zestimateLoading
    ? "Loading…"
    : zestimateError
      ? "Unavailable"
      : zestimateUsd != null
        ? formatUsd(zestimateUsd)
        : "—";

  const highestDisplay =
    bestOfferCents > 0 ? formatProposalUsd(bestOfferCents) : proposalCount > 0 ? "—" : "—";

  return (
    <section
      className={[
        "kalshi-border rounded-xl border bg-[var(--background)] p-3 shadow-sm ring-1 ring-[var(--border)]/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Market snapshot"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
          Market snapshot
        </p>
        <Image
          src="/zillow-logo.png"
          alt="Zillow"
          width={72}
          height={18}
          className="h-4 w-auto shrink-0 object-contain"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5">
          <p className="text-[0.6875rem] font-medium text-[var(--foreground-muted)]">Zestimate</p>
          <p className="mt-0.5 truncate font-tabular text-base font-semibold text-[var(--foreground)]">
            {zestimateDisplay}
          </p>
        </div>
        <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5">
          <p className="text-[0.6875rem] font-medium text-[var(--foreground-muted)]">
            Highest proposal
          </p>
          <p className="mt-0.5 truncate font-tabular text-base font-semibold text-[var(--success)]">
            {highestDisplay}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-center text-[0.6875rem] font-medium text-[var(--foreground-muted)]">
        {proposalLine}
      </p>
    </section>
  );
}
