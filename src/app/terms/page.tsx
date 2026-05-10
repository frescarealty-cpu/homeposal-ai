import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - HomePosal",
  description:
    "Terms of Service for HomePosal, operated by FRESCA REALTY INC (DRE #01835770).",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-[95%] sm:max-w-[800px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Terms of Service
      </h1>

      <p className="mt-6 text-base leading-relaxed text-[var(--foreground-muted)]">
        Welcome to HomePosal. These Terms of Service (&quot;Terms&quot;) govern your access
        to and use of the website and services provided by{" "}
        <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>, a licensed
        California Real Estate Broker (<strong className="text-[var(--foreground)]">DRE #01835770</strong>),
        doing business as HomePosal (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
      </p>

      <p className="mt-3 text-base leading-relaxed text-[var(--foreground-muted)]">
        By using this website, you agree to be bound by these Terms. If you do not agree,
        please do not use our services.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          1. Nature of the Service: The &quot;Bulletin Board&quot;
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          HomePosal acts as a hosting venue and digital bulletin board for Southern California
          property proposals.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Not a Listing Service: We do not currently list the properties displayed on this
          site for sale. HomePosal is a platform for viewing and submitting public
          interest.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Non-Agency: Viewing or submitting a proposal does not create an agency relationship
          or listing agreement between you and <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong>.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          2. Transition of Services &amp; Agency Disclosure
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          In accordance with California Civil Code §2079.14:
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Initial Interaction: No agency is created by using this site.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Formal Engagement: An agency relationship is only established if a user and{" "}
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> execute a
          written Agency Disclosure and a formal representation or listing agreement.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Broker Presentation: If an owner requests a formal presentation of a proposal,{" "}
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> acts as the
          facilitating broker and will provide all legally required disclosures at that time.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          3. Accuracy of Information &amp; AI Disclosure (AB 723)
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Public Data: Property data is gathered from public records. We do not guarantee its
          accuracy, and users should perform their own due diligence.
        </p>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Digitally Altered Images: Per California{" "}
          <Link href="/digital-image-disclosure" className="text-[var(--accent)] hover:underline">
            AB 723
          </Link>{" "}
          (Effective Jan 1, 2026), any image on this site that has been digitally altered or
          AI-enhanced (e.g., virtual staging, object removal) must be clearly labeled. Where
          an altered image is shown, a link to the original, unaltered image will be provided.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          4. User Conduct &amp; Prohibited Acts
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          Users agree NOT to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>Use the platform to harass, stalk, or contact property owners directly.</li>
          <li>Submit fraudulent &quot;Verified Intent&quot; documents (Proof of Funds/Pre-approvals).</li>
          <li>Use any automated system (bots, scrapers) to extract data from the site.</li>
          <li>Post defamatory or misleading content in any proposal notes.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          5. Respecting Active Listings &amp; Clear Cooperation
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          If a property is already listed with a brokerage:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-base leading-relaxed text-[var(--foreground-muted)]">
          <li>We provide the active listing details and the listing agent&apos;s contact info.</li>
          <li>
            We do not solicit properties that are subject to an active exclusive listing
            agreement with another broker, in compliance with the NAR Clear Cooperation Policy.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          6. Record Retention (B&amp;P Code §10148)
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          As a licensed California broker, <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> is required
          by law to retain copies of all documents, proposals, and communications executed or
          obtained in connection with real estate business for a period of three (3) years. This
          retention requirement overrides any general &quot;request to delete&quot; under privacy
          laws for data tied to a professional real estate activity.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          7. Limitation of Liability
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          <strong className="text-[var(--foreground)]">FRESCA REALTY INC</strong> is not responsible for the content of proposals submitted by third parties. We provide this venue
          &quot;as-is&quot; without any warranty of any kind, either express or implied. In no event shall we be liable for
          any direct, indirect, or consequential damages arising out of your use of the site.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          8. Governing Law
        </h2>
        <p className="text-base leading-relaxed text-[var(--foreground-muted)]">
          These Terms are governed by the laws of the State of California. Any disputes shall be resolved in the courts of
          San Diego County, California.
        </p>
      </section>

      <div className="mt-10 border-t border-[var(--border)] pt-6 text-sm text-[var(--foreground-muted)]">
        Privacy Policy:{" "}
        <Link href="/privacy-policy" className="text-[var(--accent)] hover:underline">
          /privacy-policy
        </Link>
      </div>
    </div>
  );
}

