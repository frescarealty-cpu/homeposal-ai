"use client";

import { useState, useEffect } from "react";

/**
 * Shows an "Opt-Out Request Honored" signal when the user has Global Privacy Control (GPC) enabled.
 * See https://globalprivacycontrol.org/ and navigator.globalPrivacyControl.
 */
export function GpcOptOutSignal() {
  const [gpcEnabled, setGpcEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Dev/test: ?gpc=1 forces the signal so you can verify the UI without a GPC-enabled browser
    const urlParams = new URLSearchParams(window.location.search);
    const forceForTest =
      process.env.NODE_ENV === "development" && urlParams.get("gpc") === "1";
    const fromBrowser =
      typeof (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === "boolean"
        ? (navigator as Navigator & { globalPrivacyControl: boolean }).globalPrivacyControl
        : false;
    setGpcEnabled(forceForTest || fromBrowser);
  }, []);

  if (gpcEnabled !== true) return null;

  return (
    <div
      className="flex items-center justify-center gap-1.5 border-t border-[var(--border)] bg-[var(--background-elevated)] px-4 py-2 text-xs text-[var(--foreground-muted)]"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--success)]"
        aria-hidden
      />
      <span>Opt-Out Request Honored</span>
    </div>
  );
}
