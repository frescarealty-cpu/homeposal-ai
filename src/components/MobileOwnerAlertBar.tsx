"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileOwnerAlertBar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);
  const hideOnDetailPage = pathname === "/place" || pathname?.startsWith("/property/") === true;

  if (hideOnDetailPage) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-[100] w-full shrink-0 md:hidden"
      role="region"
      aria-label="Owner Alert"
    >
      <div
        role="note"
        className="border border-t-0 border-[var(--border)] border-l-2 border-l-blue-400 bg-[var(--background)] px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div id="mobile-owner-alert-content" className="min-w-0 flex-1">
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
            {expanded && (
              <>
                <p className="mt-1 text-sm font-semibold tracking-tight text-[var(--foreground)]">
                  Don&apos;t List Yet.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--foreground-muted)]">
                  See bona fide proposals from verified suitors before you deal with the stress of the
                  MLS.
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background-elevated)] text-[#1C4482] transition-colors hover:bg-[var(--border-subtle)]"
            aria-expanded={expanded}
            aria-controls="mobile-owner-alert-content"
            aria-label={expanded ? "Collapse owner alert" : "Expand owner alert"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
