"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const DISPLAY_MS = 6000;
const EXIT_MS = 300;

export function MobileOwnerAlertBar() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const hideOnDetailPage = pathname === "/place" || pathname?.startsWith("/property/") === true;

  useLayoutEffect(() => {
    if (hideOnDetailPage || !isMounted || !barRef.current) return;

    const element = barRef.current;
    const updateHeight = () => setBarHeight(element.getBoundingClientRect().height);

    updateHeight();

    const resizeObserver = new ResizeObserver(() => updateHeight());
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [hideOnDetailPage, isMounted]);

  useEffect(() => {
    if (hideOnDetailPage) return;

    const enterFrame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });
    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, DISPLAY_MS);
    const unmountTimer = window.setTimeout(() => {
      setIsMounted(false);
    }, DISPLAY_MS + EXIT_MS);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(hideTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [hideOnDetailPage]);

  if (hideOnDetailPage) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        className="md:hidden transition-[height] duration-300 ease-out"
        style={{ height: isMounted && isVisible ? barHeight : 0 }}
      />

      {isMounted ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] md:hidden">
          <div className="mx-auto w-full max-w-[95%]">
            <div
              ref={barRef}
              className="pointer-events-auto transition-transform duration-300 ease-out"
              style={{
                transform: isVisible ? "translateY(0)" : "translateY(-100px)",
              }}
            >
              <div
                role="note"
                aria-label="Owner Alert"
                className="rounded-b-lg border border-t-0 border-[var(--border)] border-l-2 border-l-blue-400 bg-[var(--foreground)]/[0.03] px-3 py-2.5 shadow-sm sm:px-3.5 sm:py-3"
              >
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
                <p className="mt-1 text-sm font-semibold tracking-tight text-[var(--foreground)]">
                  Don&apos;t List Yet.
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--foreground-muted)]">
                  See bona fide proposals from verified suitors before you deal with the stress of the MLS.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
