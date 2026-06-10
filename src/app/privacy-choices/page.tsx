import { BackToHomeLink } from "@/components/BackToHomeLink";

export const metadata = {
  title: "Your California Privacy Choices - HomePosal",
  description:
    "Submit privacy requests and learn about your California privacy choices for HomePosal.",
};

export default function PrivacyChoicesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <BackToHomeLink />
      <h1 className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
        Your California Privacy Choices
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
        To submit a privacy request (access, deletion, correction, or limitation), email{" "}
        <a
          className="text-[var(--accent)] hover:underline"
          href="mailto:privacy@frescarealty.com"
        >
          privacy@frescarealty.com
        </a>
        .
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
        If you have Global Privacy Control (GPC) enabled, HomePosal will display an “Opt-Out
        Request Honored” signal while you browse.
      </p>
    </div>
  );
}

