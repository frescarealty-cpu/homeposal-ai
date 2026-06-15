import type { ReactNode } from "react";
import Link from "next/link";

type TermsOfServiceContentProps = {
  className?: string;
  /** When true, in-document links open in a new tab so the parent page state is preserved. */
  openLinksInNewTab?: boolean;
};

function TermsLink({
  href,
  children,
  openInNewTab,
}: {
  href: string;
  children: ReactNode;
  openInNewTab?: boolean;
}) {
  if (openInNewTab) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--accent)] hover:underline"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className="text-[var(--accent)] hover:underline">
      {children}
    </Link>
  );
}

export function TermsOfServiceContent({
  className = "",
  openLinksInNewTab = false,
}: TermsOfServiceContentProps) {
  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
        Welcome to HomePosal. These Terms of Service (&quot;Terms&quot;) govern your access to and
        use of the website and services provided by{" "}
        <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>, a licensed
        California Real Estate Broker (<strong className="text-[var(--foreground)]">DRE #01835770</strong>
        ), doing business as HomePosal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
      </p>

      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
        By using this website, you agree to be bound by these Terms. If you do not agree, please do
        not use our services.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          1. Nature of the Service: The &quot;Bulletin Board&quot;
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          HomePosal acts as a hosting venue and digital bulletin board for Southern California
          property proposals.
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Not a Listing Service: We do not currently list the properties displayed on this site for
          sale. HomePosal is a platform for viewing and submitting public interest.
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Non-Agency: Viewing or submitting a proposal does not create an agency relationship or
          listing agreement between you and{" "}
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          2. Transition of Services &amp; Agency Disclosure
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          In accordance with California Civil Code §2079.14:
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Initial Interaction: No agency is created by using this site.
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Formal Engagement: An agency relationship is only established if a user and{" "}
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> execute a written
          Agency Disclosure and a formal representation or listing agreement.
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Broker Presentation: If an owner requests a formal presentation of a proposal,{" "}
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> acts as the
          facilitating broker and will provide all legally required disclosures at that time.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          3. Accuracy of Information &amp; AI Disclosure (AB 723)
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Public Data: Property data is gathered from public records. We do not guarantee its
          accuracy, and users should perform their own due diligence.
        </p>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Digitally Altered Images: Per California{" "}
          <TermsLink href="/digital-image-disclosure" openInNewTab={openLinksInNewTab}>
            AB 723
          </TermsLink>{" "}
          (Effective Jan 1, 2026), any image on this site that has been digitally altered or
          AI-enhanced (e.g., virtual staging, object removal) must be clearly labeled. Where an
          altered image is shown, a link to the original, unaltered image will be provided.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          4. User Conduct &amp; Prohibited Acts
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          Users agree NOT to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          <li>Use the platform to harass, stalk, or contact property owners directly.</li>
          <li>Submit fraudulent &quot;Verified Intent&quot; documents (Proof of Funds/Pre-approvals).</li>
          <li>Use any automated system (bots, scrapers) to extract data from the site.</li>
          <li>Post defamatory or misleading content in any proposal notes.</li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          5. Respecting Active Listings &amp; Clear Cooperation
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          If a property is already listed with a brokerage:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          <li>We provide the active listing details and the listing agent&apos;s contact info.</li>
          <li>
            We do not solicit properties that are subject to an active exclusive listing agreement
            with another broker, in compliance with the NAR Clear Cooperation Policy.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          6. Record Retention (B&amp;P Code §10148)
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          As a licensed California broker,{" "}
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> is required by law
          to retain copies of all documents, proposals, and communications executed or obtained in
          connection with real estate business for a period of three (3) years. This retention
          requirement overrides any general &quot;request to delete&quot; under privacy laws for data
          tied to a professional real estate activity.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          7. Limitation of Liability
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> is not responsible
          for the content of proposals submitted by third parties. We provide this venue &quot;as-is&quot;
          without any warranty of any kind, either express or implied. In no event shall we be liable
          for any direct, indirect, or consequential damages arising out of your use of the site.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">
          8. Governing Law
        </h2>
        <p className="text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-base">
          These Terms are governed by the laws of the State of California. Any disputes shall be
          resolved in the courts of San Diego County, California.
        </p>
      </section>

      <div className="mt-8 border-t border-[var(--border)] pt-4 text-sm text-[var(--foreground-muted)]">
        Privacy Policy:{" "}
        <TermsLink href="/privacy-policy" openInNewTab={openLinksInNewTab}>
          /privacy-policy
        </TermsLink>
      </div>
    </div>
  );
}
