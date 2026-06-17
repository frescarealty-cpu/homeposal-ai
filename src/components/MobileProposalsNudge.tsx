"use client";

import { useState } from "react";
import { ArrowDown, X } from "lucide-react";

type MobileProposalsNudgeProps = {
  proposalCount: number;
  proposalsSectionId?: string;
  /** Scroll target keeps this section visible above proposals (e.g. Zestimate). */
  keepVisibleSectionId?: string;
  className?: string;
};

export function MobileProposalsNudge({
  proposalCount,
  proposalsSectionId = "property-proposals",
  keepVisibleSectionId = "property-zestimate",
  className = "",
}: MobileProposalsNudgeProps) {
  const [dismissed, setDismissed] = useState(false);

  const scrollToProposals = () => {
    const proposalsEl = document.getElementById(proposalsSectionId);
    if (!proposalsEl) return;

    const keepEl = keepVisibleSectionId
      ? document.getElementById(keepVisibleSectionId)
      : null;

    if (keepEl) {
      const keepRect = keepEl.getBoundingClientRect();
      const proposalsTop = proposalsEl.getBoundingClientRect().top + window.scrollY;
      const minTopGap = 12;
      const targetY = proposalsTop - minTopGap;
      const keepBottomOnScreen = keepRect.bottom + window.scrollY;
      const maxScroll = keepBottomOnScreen - keepRect.height * 0.35;
      window.scrollTo({
        top: Math.max(0, Math.min(targetY, maxScroll)),
        behavior: "smooth",
      });
    } else {
      proposalsEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (dismissed) return null;

  const hasProposals = proposalCount > 0;
  const headline = hasProposals
    ? proposalCount === 1
      ? "1 verified proposal"
      : `${proposalCount} verified proposals`
    : "No proposals yet";
  const detail = hasProposals ? "Review offers" : "Be the first";

  return (
    <div
      role="status"
      className={["px-4 pb-3 lg:hidden", className].filter(Boolean).join(" ")}
    >
      <div className="flex items-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400"
        >
          {hasProposals ? proposalCount : "—"}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-[var(--foreground)]">{headline}</p>
          <p className="truncate text-[0.6875rem] text-[var(--foreground-muted)]">{detail}</p>
        </div>

        <button
          type="button"
          onClick={scrollToProposals}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[0.6875rem] font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          {hasProposals ? "View" : "Propose"}
          <ArrowDown className="h-3 w-3" aria-hidden />
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
