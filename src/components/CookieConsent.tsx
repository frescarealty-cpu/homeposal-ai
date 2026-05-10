"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "homeposal-cookie-consent";

type ConsentStatus = "accepted" | "rejected" | null;

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ConsentStatus | null;
      if (stored === "accepted" || stored === "rejected") {
        setStatus(stored);
      }
    } finally {
      setMounted(true);
    }
  }, []);

  const save = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      setStatus(value);
    } catch {
      setStatus(value);
    }
  };

  if (!mounted || status !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background-elevated)] px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] sm:px-6"
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
}
