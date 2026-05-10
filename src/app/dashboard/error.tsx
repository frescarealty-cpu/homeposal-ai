"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard] error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Something went wrong</h2>
      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
        The dashboard could not load. You can try again or return home.
      </p>
      {error.message && (
        <p className="mt-3 rounded border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-xs font-mono text-[var(--foreground-muted)]">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
