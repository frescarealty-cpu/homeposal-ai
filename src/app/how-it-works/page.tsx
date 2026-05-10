import Link from "next/link";
import { HowItWorks } from "@/components/HowItWorks";

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-2 py-10 sm:px-4">
      <div className="mb-8">
        <Link href="/" className="inline-flex min-h-[44px] items-center text-sm text-[var(--success)] hover:underline">
          ← Back to Home
        </Link>
        <h1 className="mt-4 text-balance text-3xl font-semibold text-[var(--foreground)]">
          How HomePosal Works
        </h1>
        <p className="mt-2 text-base text-[var(--foreground-muted)]">
          The Public Bulletin Board for Southern California Real Estate
        </p>
      </div>

      <nav
        aria-label="On this page"
        className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">On this page</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="#the-concept"
            className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            The Concept
          </a>
          <a
            href="#how-it-works"
            className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            How it Works
          </a>
          <a
            href="#why-homeposal"
            className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            Why HomePosal?
          </a>
          <a
            href="#faq"
            className="inline-flex min-h-[36px] items-center rounded-full border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            FAQ
          </a>
        </div>
      </nav>

      <HowItWorks />
    </div>
  );
}
