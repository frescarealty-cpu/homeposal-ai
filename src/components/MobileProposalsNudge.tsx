"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const MOBILE_MAX_WIDTH_PX = 1023;

type MobileProposalsNudgeProps = {
  proposalCount: number;
  proposalsSectionId?: string;
  /** Scroll target keeps this section visible above proposals (e.g. Zestimate). */
  keepVisibleSectionId?: string;
};

function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

export function MobileProposalsNudge({
  proposalCount,
  proposalsSectionId = "property-proposals",
  keepVisibleSectionId = "property-zestimate",
}: MobileProposalsNudgeProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useMobileLayout();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !isMobile || dismissed) return null;

  const hasProposals = proposalCount > 0;
  const message = hasProposals
    ? proposalCount === 1
      ? "1 verified proposal on this property."
      : `${proposalCount} verified proposals on this property.`
    : "No proposals yet — you could be the first.";

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 z-[86] px-3"
      style={{
        bottom:
          "calc(var(--cookie-consent-offset, 0px) + var(--owner-banner-offset, 3.75rem) + 0.5rem)",
      }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[95%]">
        <div className="relative rounded-xl border border-emerald-200/80 bg-white px-3 py-2.5 shadow-xl dark:border-emerald-900/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute right-2 top-2 rounded-md p-1 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
          <p className="pr-6 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            Proposals
          </p>
          <p className="mt-0.5 pr-5 text-xs leading-snug text-[var(--foreground)]">{message}</p>
          <button
            type="button"
            onClick={scrollToProposals}
            className="mt-2 text-xs font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {hasProposals ? "View proposals ↓" : "See how to propose ↓"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
