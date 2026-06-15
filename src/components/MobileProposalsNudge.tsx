"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type MobileProposalsNudgeProps = {
  proposalCount: number;
  /** sessionStorage key — dismissed state persists for the browser session. */
  storageKey: string;
  proposalsSectionId?: string;
  /** Scroll target keeps this section visible above proposals (e.g. Zestimate). */
  keepVisibleSectionId?: string;
};

export function MobileProposalsNudge({
  proposalCount,
  storageKey,
  proposalsSectionId = "property-proposals",
  keepVisibleSectionId = "property-zestimate",
}: MobileProposalsNudgeProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem(storageKey) === "1") return;
    const timer = window.setTimeout(() => setVisible(true), 500);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(storageKey, "1");
  };

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

    dismiss();
  };

  if (!mounted || !visible) return null;

  const hasProposals = proposalCount > 0;
  const message = hasProposals
    ? proposalCount === 1
      ? "1 verified proposal on this property."
      : `${proposalCount} verified proposals on this property.`
    : "No proposals yet — you could be the first.";

  return (
    <div
      role="status"
      className="mb-3 md:hidden motion-safe:animate-[proposals-nudge-in_0.35s_ease-out]"
    >
      <div className="relative rounded-xl border border-white/50 bg-white/90 px-3 py-2.5 shadow-lg backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/90">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 rounded-md p-1 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
        <p className="pr-6 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
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
  );
}
