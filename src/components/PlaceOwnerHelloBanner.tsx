"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ContactInviteLink } from "@/components/ContactInviteLink";

type PlaceOwnerHelloBannerProps = {
  ownerInquiryPhone?: string;
  className?: string;
  defaultExpanded?: boolean;
  /** Milliseconds before auto-collapse; 0 disables. */
  autoCollapseMs?: number;
};

export function PlaceOwnerHelloBanner({
  ownerInquiryPhone = "760-123-4560",
  className = "",
  defaultExpanded = true,
  autoCollapseMs = 6000,
}: PlaceOwnerHelloBannerProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentId = "place-owner-hello-content";

  useEffect(() => {
    if (!autoCollapseMs || autoCollapseMs <= 0) return;
    const timer = window.setTimeout(() => setExpanded(false), autoCollapseMs);
    return () => window.clearTimeout(timer);
  }, [autoCollapseMs]);

  return (
    <div
      role="region"
      aria-label="Owner hello banner"
      className={[
        "w-full shrink-0 border-b border-[var(--border)] border-l-2 border-l-blue-400 bg-[var(--background)] px-4 py-3 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <AlertCircle
              className="h-3.5 w-3.5 shrink-0 text-[#1C4482]"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1C4482]">
              Owner Alert
            </p>
          </div>
          <p className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">
            Don&apos;t List Yet.
          </p>
          {expanded && (
            <div id={contentId} className="mt-2 space-y-3">
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Are you the owner and want more information on a proposal?
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <ContactInviteLink
                  contactType="owner-proposal"
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#1C4482] px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                >
                  Get More Info
                </ContactInviteLink>
                <a
                  href={`tel:${ownerInquiryPhone}`}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border-subtle)]"
                >
                  Call {ownerInquiryPhone}
                </a>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] text-[#1C4482] transition-colors hover:bg-[var(--border-subtle)]"
          aria-expanded={expanded}
          aria-controls={contentId}
          aria-label={expanded ? "Collapse owner hello banner" : "Expand owner hello banner"}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
