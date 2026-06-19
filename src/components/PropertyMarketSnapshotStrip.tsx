"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ZillowZestimatePayload } from "@/types/zillow";

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

function zillowHomesUrl(address: string) {
  const q = encodeURIComponent(address);
  return `https://www.zillow.com/homes/${q}_rb/`;
}

function getBridgeZillowUrl(raw: unknown): string | null {
  const anyRaw: any = raw;
  const first = Array.isArray(anyRaw?.bundle) && anyRaw.bundle.length > 0 ? anyRaw.bundle[0] : null;
  const url = first?.zillowUrl;
  if (typeof url === "string" && url.startsWith("http")) return url;
  const zpid = first?.zpid;
  if (typeof zpid === "string" && zpid) {
    return `https://www.zillow.com/homedetails/${encodeURIComponent(zpid)}_zpid/`;
  }
  return null;
}

type PropertyMarketSnapshotStripProps = {
  zestimateUsd: number | null | undefined;
  zestimateLoading?: boolean;
  zestimateError?: string | null;
  zestimateData?: ZillowZestimatePayload | null;
  normalizedAddress?: string;
  bestOfferCents: number;
  className?: string;
};

export function PropertyMarketSnapshotStrip({
  zestimateUsd,
  zestimateLoading = false,
  zestimateError = null,
  zestimateData = null,
  normalizedAddress = "",
  bestOfferCents,
  className = "",
}: PropertyMarketSnapshotStripProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const zestimateDisplay = zestimateLoading
    ? "Loading…"
    : zestimateError
      ? "Unavailable"
      : zestimateUsd != null
        ? formatUsd(zestimateUsd)
        : "—";

  const highestDisplay = bestOfferCents > 0 ? formatProposalUsd(bestOfferCents) : "—";
  const zillowPropertyLink =
    getBridgeZillowUrl(zestimateData?.raw) ?? zillowHomesUrl(normalizedAddress);

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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex h-4 items-center">
            <Image
              src="/zillow-logo.png"
              alt="Zillow"
              width={72}
              height={18}
              className="h-4 w-auto object-contain"
            />
          </div>
          <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5">
            <p className="text-[0.6875rem] font-medium text-[var(--foreground-muted)]">Zestimate</p>
            <p className="mt-0.5 truncate font-tabular text-base font-semibold text-[var(--foreground)]">
              {zestimateDisplay}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex h-4 items-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
              Market snapshot
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
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-left transition-colors hover:bg-[var(--border-subtle)]"
        aria-expanded={detailsOpen}
      >
        <span className="text-xs font-medium text-[var(--foreground)]">View rent, range &amp; more</span>
        <span className="shrink-0 text-xs font-medium text-[var(--foreground-muted)]">
          {detailsOpen ? "Hide" : "Details"} <span aria-hidden>{detailsOpen ? "▴" : "▾"}</span>
        </span>
      </button>

      {detailsOpen && (
        <div className="mt-3 space-y-3 border-t border-[var(--border)]/60 pt-3">
          {zestimateLoading ? (
            <div className="space-y-3">
              <div className="h-5 w-40 rounded bg-[var(--border-subtle)]" />
              <div className="grid grid-cols-1 gap-3">
                <div className="h-14 rounded bg-[var(--border-subtle)]" />
                <div className="h-14 rounded bg-[var(--border-subtle)]" />
              </div>
            </div>
          ) : zestimateError ? (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3 text-sm text-[var(--foreground-muted)]">
              <p className="font-medium text-[var(--foreground)]">Zestimate unavailable</p>
              <p className="mt-1">{zestimateError}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                  <p className="text-xs text-[var(--foreground-muted)]">Zestimate</p>
                  <p className="mt-1 font-tabular text-base font-semibold text-[var(--foreground)]">
                    {zestimateData?.zestimateUsd != null ? formatUsd(zestimateData.zestimateUsd) : "—"}
                  </p>
                  {zestimateData?.zestimateRangeLowUsd != null &&
                    zestimateData?.zestimateRangeHighUsd != null && (
                      <p className="mt-1 text-[0.7rem] text-[var(--foreground-muted)]">
                        Range: {formatUsd(zestimateData.zestimateRangeLowUsd)} –{" "}
                        {formatUsd(zestimateData.zestimateRangeHighUsd)}
                      </p>
                    )}
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                  <p className="text-xs text-[var(--foreground-muted)]">Rent Zestimate</p>
                  <p className="mt-1 font-tabular text-base font-semibold text-[var(--foreground)]">
                    {zestimateData?.rentZestimateUsd != null
                      ? formatUsd(zestimateData.rentZestimateUsd)
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                  <p className="text-xs text-[var(--foreground-muted)]">Last updated</p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">
                    {zestimateData?.lastUpdated
                      ? new Date(zestimateData.lastUpdated).toLocaleDateString("en-US")
                      : "—"}
                  </p>
                </div>
              </div>
              {normalizedAddress ? (
                <Link
                  href={zillowPropertyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[28px] items-center text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  See more details for {normalizedAddress} on Zillow
                </Link>
              ) : null}
              <p className="text-[0.7rem] leading-relaxed text-[var(--foreground-muted)]">
                Data is provided “as is” via the Zestimate API.
              </p>
              <p className="text-[0.7rem] leading-relaxed text-[var(--foreground-muted)]">
                © Zillow, Inc., 2006-2023. Use is subject to{" "}
                <Link
                  href="https://www.zillow.com/corp/Terms.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--foreground)] hover:underline"
                >
                  Terms of Use
                </Link>
                .
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
