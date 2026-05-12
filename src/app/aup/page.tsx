import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | HomePosal",
  description:
    "Review the community guidelines and acceptable use standards for submitting property proposals on HomePosal.",
};

export default function AcceptableUsePolicyPage() {
  return (
    <div className="mx-auto w-full max-w-[95%] sm:max-w-[800px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Acceptable Use Policy: Property Proposals
      </h1>
      <p className="mt-2 text-base text-[var(--foreground-muted)]">
        Last Updated: February 26, 2026
      </p>

      <p className="mt-6 text-base leading-relaxed text-[var(--foreground-muted)]">
        To maintain the integrity of the HomePosal bulletin board and protect the privacy of
        Southern California property owners, all users submitting proposals must adhere to
        this Acceptable Use Policy. HomePosal is operated by{" "}
        <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>, a licensed
        California Real Estate Broker (<strong className="text-[var(--foreground)]">DRE #01835770</strong>).
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          1. Verified Intent &amp; Financial Documentation
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          By submitting a proposal, you agree to provide authentic, up-to-date documentation
          of financial readiness (Proof of Funds or Pre-approval).
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Accuracy: You represent that all uploaded documents are bona fide and accurately
          reflect your financial position.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Prohibited Actions: Submitting &quot;dummy&quot; documents, expired letters, or
          financial statements belonging to third parties is strictly prohibited and will
          result in a permanent ban from the platform.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Verification: You authorize <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> to perform basic
          verification of these documents. This is a security measure and does not create an
          agency relationship. For more information on how we handle your information, see
          our{" "}
          <Link href="/privacy-policy" className="text-[var(--accent)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          2. Interaction with Property Owners
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          HomePosal is built around two optional owner paths—Browse Proposals and Invite
          Proposals—described on our{" "}
          <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">
            How it Works
          </Link>{" "}
          page. Owners are in the driver&apos;s seat.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          No Direct Solicitation: You are strictly prohibited from using information found on
          this site to contact property owners directly via mail, phone, or in-person visits.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Zero Pressure: All communication must be facilitated through the HomePosal
          platform. Any attempt to &quot;bypass&quot; the system to pressure an owner will be
          reported as a violation of our terms.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          3. Submission of Media &amp; AI Disclosure (AB 723)
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          If you upload images or renderings as part of your proposal:
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Digital Alterations: Per California{" "}
          <Link href="/digital-disclosure" className="text-[var(--accent)] hover:underline">
            AB 723
          </Link>
          , you must disclose if any image has been digitally altered or AI-enhanced to add,
          remove, or change elements of the property (e.g., virtual renovation).
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Originals Required: If you submit an altered image, you must also provide the
          original, unaltered photo for comparison.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Rights: You represent that you own the rights to any media uploaded and grant
          HomePosal a limited license to display it to the property owner.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          4. Prohibited Content
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Proposals must not contain:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>
            Speculative Data: Misleading &quot;estimates&quot; or predatory &quot;low-ball&quot;
            language designed to distress an owner.
          </li>
          <li>
            Personal Solicitations: Links to outside services, personal advertisements, or
            spam.
          </li>
          <li>
            Offensive Material: Any language that is discriminatory, harassing, or violates
            Fair Housing laws.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          5. Enforcement &amp; DRE Reporting
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          As a platform operated by a licensed broker (
          <strong className="text-[var(--foreground)]">DRE #01835770</strong>), we take
          platform abuse seriously.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Account Termination: We reserve the right to remove any proposal and terminate
          access for any user who violates these rules.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Legal Action: Fraudulent financial submissions may be referred to the appropriate
          regulatory or law enforcement agencies.
        </p>
      </section>
    </div>
  );
}

