"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isAborted =
    error.name === "AbortError" ||
    (error.message && /abort|aborted/i.test(error.message));

  const message =
    typeof error?.message === "string"
      ? error.message
      : error?.digest
        ? `Error digest: ${error.digest}`
        : error != null && typeof error.toString === "function"
          ? error.toString()
          : "No error details (check browser Console → F12)";

  const isConfig =
    /Missing Supabase config/i.test(message) ||
    /Missing API key|Resend/i.test(message) ||
    /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE/i.test(message);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        {isAborted ? "Loading was interrupted" : "Something went wrong"}
      </h2>
      <p className="max-w-md text-sm text-[var(--foreground-muted)]">
        {isAborted
          ? "The page load was interrupted (this can happen during refresh or in dev mode). Click below to try again."
          : "An unexpected error occurred. You can try again."}
      </p>
      {!isAborted && (
        <p className="max-w-lg rounded border border-[var(--border)] bg-[var(--background-elevated)] px-3 py-2 text-left text-xs font-mono text-[var(--foreground-muted)] break-words">
          {message}
        </p>
      )}
      {!isAborted && isConfig && (
        <p className="max-w-md text-xs text-[var(--foreground-muted)]">
          Add the required environment variables in Vercel (Settings → Environment Variables) and redeploy.
        </p>
      )}
      {!isAborted && (
        <p className="max-w-md text-xs text-[var(--foreground-muted)]">
          Check the browser Console (F12) and Vercel → Deployments → Logs for the full error.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
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
