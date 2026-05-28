"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const STORAGE_KEY = "homeposal-cookie-consent";
const CONSENT_OFFSET_VAR = "--cookie-consent-offset";

type ConsentStatus = "accepted" | "rejected" | null;

function readStoredConsent(): ConsentStatus | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "rejected") return stored;
    return null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [mounted, setMounted] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (process.env.NODE_ENV === "development" && params.get("reset-cookie-consent") === "1") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setStatus(null);
      setMounted(true);
      return;
    }

    setStatus(readStoredConsent());
    setMounted(true);
  }, []);

  const showBar = mounted && status === null;

  useEffect(() => {
    if (!showBar) {
      document.documentElement.style.removeProperty(CONSENT_OFFSET_VAR);
      return;
    }

    const syncOffset = () => {
      const height = barRef.current?.offsetHeight ?? 0;
      if (height > 0) {
        document.documentElement.style.setProperty(CONSENT_OFFSET_VAR, `${height}px`);
        window.dispatchEvent(new Event("cookie-consent-layout"));
      }
    };

    syncOffset();
    const el = barRef.current;
    if (!el) return;

    const ro = new ResizeObserver(syncOffset);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty(CONSENT_OFFSET_VAR);
    };
  }, [showBar]);

  const save = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setStatus(value);
  };

  if (!showBar) return null;

  const bar = (
    <div
      ref={barRef}
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[120] border-t border-[var(--border)] bg-[var(--background-elevated)] px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base text-[var(--foreground)]">
          We use cookies for essential site function (e.g. staying logged in) and to improve
          your experience. You can{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-[var(--accent)] underline hover:no-underline"
          >
            read our Privacy Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => save("rejected")}
            className="min-h-[44px] rounded-md border border-[var(--border)] bg-transparent px-4 py-2.5 text-base font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="min-h-[44px] rounded-md bg-[var(--accent)] px-4 py-2.5 text-base font-medium text-white hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(bar, document.body);
}
