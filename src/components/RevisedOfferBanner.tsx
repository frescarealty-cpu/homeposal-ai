"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RevisedOfferBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("revised") === "1") {
      const timer = window.setTimeout(() => {
        params.delete("revised");
        const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
      }, 8000);
      return () => window.clearTimeout(timer);
    }
  }, [router]);

  if (!visible) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
      <p className="font-medium">Your revised offer has been saved.</p>
      <p className="mt-1 text-[var(--foreground-muted)]">
        It is now pending approval. Our team will review it and, once approved, it will be posted publicly again.
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="mt-2 text-xs font-medium text-amber-700 underline hover:no-underline dark:text-amber-300"
        aria-label="Dismiss"
      >
        Dismiss
      </button>
    </div>
  );
}
