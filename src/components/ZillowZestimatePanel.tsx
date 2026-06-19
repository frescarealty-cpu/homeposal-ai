"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useZillowZestimate } from "@/hooks/useZillowZestimate";
import type { ZillowZestimatePayload } from "@/types/zillow";

type Props = {
  address: string;
  lat?: number;
  lng?: number;
  variant?: "default" | "compact" | "collapsible";
  /** Collapsible: hide summary row when a market snapshot strip is shown above. */
  detailsOnly?: boolean;
  /** Skip internal fetch when parent already loaded Zestimate data. */
  estimate?: {
    loading: boolean;
    error: string | null;
    data: ZillowZestimatePayload | null;
    normalizedAddress: string;
    lookupAddress: string;
  };
  className?: string;
};

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function zillowHomesUrl(address: string) {
  // Best-effort “search by address” URL that works reliably for arbitrary inputs.
  const q = encodeURIComponent(address);
  return `https://www.zillow.com/homes/${q}_rb/`;
}

function getBridgeZillowUrl(raw: unknown): string | null {
  const anyRaw: any = raw;
  const first = Array.isArray(anyRaw?.bundle) && anyRaw.bundle.length > 0 ? anyRaw.bundle[0] : null;
  const url = first?.zillowUrl;
  if (typeof url === "string" && url.startsWith("http")) return url;
  const zpid = first?.zpid;
  if (typeof zpid === "string" && zpid) return `https://www.zillow.com/homedetails/${encodeURIComponent(zpid)}_zpid/`;
  return null;
}

export function ZillowZestimatePanel({
  address,
  lat,
  lng,
  variant = "default",
  detailsOnly = false,
  estimate: estimateProp,
  className,
}: Props) {
  const internalEstimate = useZillowZestimate(address, lat, lng, !estimateProp);
  const estimate = estimateProp ?? internalEstimate;
  const { loading, error, data, normalizedAddress } = estimate;

  const [open, setOpen] = useState(false);

  const zillowPropertyLink = getBridgeZillowUrl(data?.raw) ?? zillowHomesUrl(normalizedAddress);
  const isCompact = variant === "compact";
  const isCollapsible = variant === "collapsible";
  const showDetails = !isCollapsible || open;

  const sectionPad = isCompact ? "p-3 sm:p-4" : "p-4 sm:p-5";
  const blockGap = isCompact ? "gap-3" : "gap-4";

  return (
    <section
      className={[
        "kalshi-border flex flex-col rounded-xl bg-[var(--background)] shadow-sm",
        sectionPad,
        blockGap,
        "ring-1 ring-[var(--border)]/60",
        className ?? "",
      ].join(" ")}
      aria-label="Zillow Zestimate details"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">
            {detailsOnly ? "Zestimate details" : isCompact ? "Market snapshot" : "Zestimate"}
          </h2>
        </div>

        {/* Approved Zillow logo adjacent to Zestimate content */}
        {!detailsOnly ? (
          <div className="flex shrink-0 items-center gap-2">
            <Image
              src="/zillow-logo.png"
              alt="Zillow"
              width={84}
              height={20}
              className={isCompact ? "h-4 w-auto object-contain" : "h-5 w-auto object-contain"}
              priority={false}
            />
          </div>
        ) : null}
      </div>

      {isCollapsible && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-left transition-colors hover:bg-[var(--border-subtle)]"
          aria-expanded={open}
        >
          {detailsOnly ? (
            <>
              <span className="text-sm font-medium text-[var(--foreground)]">View rent, range &amp; more</span>
              <span className="shrink-0 text-xs font-medium text-[var(--foreground-muted)]">
                {open ? "Hide" : "Details"} <span aria-hidden>{open ? "▴" : "▾"}</span>
              </span>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-[0.7rem] text-[var(--foreground-muted)]">Zestimate</p>
                <p className="mt-0.5 truncate font-tabular text-sm font-semibold text-[var(--foreground)]">
                  {loading
                    ? "Loading…"
                    : error
                      ? "Unavailable"
                      : data?.zestimateUsd != null
                        ? formatUsd(data.zestimateUsd)
                        : "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-[var(--foreground-muted)]">
                {open ? "Hide" : "Details"} <span aria-hidden>{open ? "▴" : "▾"}</span>
              </span>
            </>
          )}
        </button>
      )}

      {showDetails && (
        <div>
        {loading ? (
          <div className="space-y-3">
            <div className="h-5 w-40 rounded bg-[var(--border-subtle)]" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="h-14 rounded bg-[var(--border-subtle)]" />
              <div className="h-14 rounded bg-[var(--border-subtle)]" />
              <div className="h-14 rounded bg-[var(--border-subtle)]" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3 text-sm text-[var(--foreground-muted)]">
            <p className="font-medium text-[var(--foreground)]">Zestimate unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3">
              <p className="text-xs text-[var(--foreground-muted)]">Zestimate</p>
              <p className="mt-1 font-tabular text-base font-semibold text-[var(--foreground)]">
                {data?.zestimateUsd != null ? formatUsd(data.zestimateUsd) : "—"}
              </p>
              {data?.zestimateRangeLowUsd != null && data?.zestimateRangeHighUsd != null && (
                <p className="mt-1 text-[0.7rem] text-[var(--foreground-muted)]">
                  Range: {formatUsd(data.zestimateRangeLowUsd)} – {formatUsd(data.zestimateRangeHighUsd)}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3">
              <p className="text-xs text-[var(--foreground-muted)]">Rent Zestimate</p>
              <p className="mt-1 font-tabular text-base font-semibold text-[var(--foreground)]">
                {data?.rentZestimateUsd != null ? formatUsd(data.rentZestimateUsd) : "—"}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3">
              <p className="text-xs text-[var(--foreground-muted)]">Last updated</p>
              <p className="mt-1 text-sm text-[var(--foreground)]">
                {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString("en-US") : "—"}
              </p>
            </div>
          </div>
        )}
        </div>
      )}

      {showDetails && (
        <div className={isCompact ? "space-y-1.5" : "space-y-2"}>
        {/* Required link copy */}
        <Link
          href={zillowPropertyLink}
          target="_blank"
          rel="noopener noreferrer"
          className={[
            "inline-flex items-center font-medium text-[var(--accent)] hover:underline",
            isCompact ? "min-h-[28px] text-xs" : "min-h-[36px] text-sm",
          ].join(" ")}
        >
          See more details for {normalizedAddress} on Zillow
        </Link>

        {/* Required “as is” disclaimer */}
        <p className="text-[0.7rem] leading-relaxed text-[var(--foreground-muted)]">
          Data is provided “as is” via the Zestimate API.
        </p>
        </div>
      )}

      {/* Zillow attribution: show only alongside Zestimate data (this panel). */}
      <div className="border-t border-[var(--border)]/60 pt-3 text-[0.7rem] leading-relaxed text-[var(--foreground-muted)]">
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
      </div>
    </section>
  );
}

