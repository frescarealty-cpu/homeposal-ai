"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin] error boundary:", error);
  }, [error]);

  const message =
    typeof error?.message === "string"
      ? error.message
      : error?.digest
        ? `Error digest: ${error.digest}`
        : error != null && typeof error.toString === "function"
          ? error.toString()
          : "No details — open browser Console (F12) for the full error.";

  const isConfig = /Missing Supabase admin config/i.test(message);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
        <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
          ← Back to Home
        </Link>
      </div>
      <div
        className={`rounded-md border p-6 ${
          isConfig
            ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
        }`}
      >
        <p className="font-medium text-[var(--foreground)]">
          {isConfig ? "Admin is not configured" : "Something went wrong"}
        </p>
        <p className="mt-2 break-words text-sm font-mono text-[var(--foreground-muted)]">{message}</p>
        {isConfig && (
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your deployment environment (e.g. Vercel → Settings → Environment Variables).
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
