import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - HomePosal",
  description:
    "Privacy Policy for HomePosal, operated by FRESCA REALTY INC (DRE #01835770). Learn about your CCPA/CPRA rights and our data handling practices.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto w-full max-w-[95%] sm:max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Privacy Policy
      </h1>

      <p className="mt-3 text-base text-[var(--foreground-muted)]">
        Effective Date: February 25, 2026
      </p>
      <p className="mt-1 text-base text-[var(--foreground-muted)]">
        Operated by: <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>{" "}
        (<strong className="text-[var(--foreground)]">DRE #01835770</strong>)
      </p>

      <p className="mt-6 text-base leading-relaxed text-[var(--foreground-muted)]">
        At HomePosal, powered by{" "}
        <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>, we respect
        your privacy. This policy explains how we handle personal information on our bulletin
        board platform and your rights under the California Consumer Privacy Act (CCPA) and
        California Privacy Rights Act (CPRA).
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          1. Notice at Collection: Information We Collect
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          In the past 12 months, we have collected the following categories of personal
          information:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>
            Identifiers: Name, email address, phone number, and IP address.
          </li>
          <li>
            Property Information: Address and ownership details of properties you interact
            with or submit proposals for.
          </li>
          <li>
            Sensitive Personal Information: Financial readiness documents (Proof of Funds or
            Pre-approval letters) provided by suitors to fulfill our &quot;Verified Intent&quot;
            requirement.
          </li>
          <li>
            Internet/Electronic Activity: Browsing history, search queries, and interactions
            with our website.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          2. How We Use Your Information (Purpose Limitation)
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          We use your data strictly for the following business purposes:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>
            Proposal Facilitation: To verify that suitor interest is bona fide (&quot;Verified
            Intent&quot;) before hosting it on the bulletin board.
          </li>
          <li>
            Owner Notification: To provide requested details to property owners only upon
            their explicit initiation and request.
          </li>
          <li>
            DRE Compliance: To maintain records required by the California Department of Real
            Estate (Business &amp; Professions Code §10148).
          </li>
          <li>
            Security: To prevent fraudulent proposals and protect the integrity of the
            platform.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          3. No Sale or Sharing of Personal Information
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> does not
          sell your personal information. Furthermore, we do not &quot;share&quot; your
          information for cross-context behavioral advertising. We only disclose your
          information to a property owner if you explicitly submit a proposal for their
          property and we have verified your intent.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          4. Your California Privacy Rights
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          As a California resident, you have the following rights:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>
            Right to Know/Access: Request a report of the specific pieces of personal
            information we have collected about you since January 1, 2022.
          </li>
          <li>
            Right to Delete: Request that we delete your personal information (subject to
            certain exceptions, such as records we must keep for DRE legal audits).
          </li>
          <li>
            Right to Correct: Request the correction of inaccurate personal information.
          </li>
          <li>
            Right to Limit: You have the right to limit the use of your Sensitive Personal
            Information (financial docs) to only that which is necessary to verify your
            proposal.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          5. Data Retention Period
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          We adhere to &quot;Data Minimization&quot; principles:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>
            Proposals: Financial documents and identifiers for unaccepted
            proposals are typically purged from our active systems after 90 days.
          </li>
          <li>
            Legal Requirement: If a proposal leads to a formal presentation or agency
            agreement, <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>{" "}
            is required by DRE law to retain certain records for 3 years.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          6. Global Privacy Control (GPC)
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Our website is configured to recognize and honor Global Privacy Control (GPC)
          signals. If your browser sends a GPC signal, our system will automatically treat it
          as a request to opt-out of any non-essential data processing.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          7. Contact Information
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          To exercise your rights or ask questions about this policy:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>Email: privacy@frescarealty.com</li>
          <li>
            Web:{" "}
            <Link href="/privacy-choices" className="text-[var(--accent)] hover:underline">
              Your California Privacy Choices
            </Link>
          </li>
          <li>
            Mail: <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>, [Your Business Address],
            Southern California.
          </li>
        </ul>
      </section>
    </div>
  );
}

