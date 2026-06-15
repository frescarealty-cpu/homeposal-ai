import type { Metadata } from "next";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";

export const metadata: Metadata = {
  title: "Terms of Service - HomePosal",
  description:
    "Terms of Service for HomePosal, operated by FRESCA REALTY INC (DRE #01835770).",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-[95%] sm:max-w-[800px] px-4 py-10 sm:px-6">
      <BackToHomeLink />
      <h1 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        Terms of Service
      </h1>
      <TermsOfServiceContent className="mt-6" />
    </div>
  );
}
