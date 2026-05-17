"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";

export function MobileOwnerAlertBar() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [barHeight, setBarHeight] = useState(0);
  const hideOnDetailPage = pathname === "/place" || pathname?.startsWith("/property/") === true;

  useLayoutEffect(() => {
    if (hideOnDetailPage || !barRef.current) return;

    const element = barRef.current;
    const updateHeight = () => setBarHeight(element.getBoundingClientRect().height);

    updateHeight();

    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [hideOnDetailPage, expanded]);

  if (hideOnDetailPage) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="md:hidden transition-[height] duration-300 ease-out"
        style={{ height: barHeight }}
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] md:hidden">
        <div className="mx-auto w-full max-w-[95%]">
          <div ref={barRef} className="pointer-events-auto">
            <div
              role="note"
              aria-label="Owner Alert"
              className="rounded-b-lg border border-t-0 border-[var(--border)] border-l-2 border-l-blue-400 bg-[var(--foreground)]/[0.03] px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3"
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
                  className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] text-[#1C4482] transition-colors hover:bg-[var(--border-subtle)]"
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
        </div>
      </div>
    </>
  );
}
