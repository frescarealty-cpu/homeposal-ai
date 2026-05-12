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
        <p className="text-sm leading-relaxed text-[var(--foreground)]">
          <span className="font-semibold text-[var(--foreground)]">On this page:</span>{" "}
          <a href="#the-concept" className="text-[var(--success)] underline-offset-2 hover:underline">
            The Concept
          </a>
          <span className="text-[var(--foreground-muted)]" aria-hidden>
            {" "}
            |{" "}
          </span>
          <a href="#how-it-works" className="text-[var(--success)] underline-offset-2 hover:underline">
            How it Works
          </a>
          <span className="text-[var(--foreground-muted)]" aria-hidden>
            {" "}
            |{" "}
          </span>
          <a
            href="#option-b-active-invitation"
            className="text-[var(--success)] underline-offset-2 hover:underline"
          >
            Option B
          </a>
          <span className="text-[var(--foreground-muted)]" aria-hidden>
            {" "}
            |{" "}
          </span>
          <a href="#why-homeposal" className="text-[var(--success)] underline-offset-2 hover:underline">
            Why HomePosal?
          </a>
          <span className="text-[var(--foreground-muted)]" aria-hidden>
            {" "}
            |{" "}
          </span>
          <a href="#faq" className="text-[var(--success)] underline-offset-2 hover:underline">
            FAQ
          </a>
        </p>
      </nav>

      <HowItWorks />
    </div>
  );
}
