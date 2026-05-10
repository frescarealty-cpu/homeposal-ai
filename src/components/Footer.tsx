"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const [legalModalOpen, setLegalModalOpen] = useState(false);

  const closeModal = useCallback(() => setLegalModalOpen(false), []);

  useEffect(() => {
    if (!legalModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [legalModalOpen, closeModal]);

  return (
    <>
      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="flex w-full flex-col items-center gap-4 px-4 py-4 text-xs sm:text-sm md:pl-16 md:pr-4">
          <div className="flex w-full flex-col items-center gap-4 md:flex-row md:flex-nowrap md:justify-between md:items-center">
            <div className="space-y-1 text-center md:text-left text-[var(--foreground-muted)]">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <span>
                  2026{" "}
                  <Link href="/" className="text-[var(--foreground)] hover:underline">
                    HomePosal
                  </Link>
                </span>
                <Link
                  href="https://www.hud.gov/contactus/fairhousing"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Fair Housing information (HUD)"
                >
                  <Image
                    src="/fair-housing.png"
                    alt="Equal Housing Opportunity"
                    width={32}
                    height={30}
                    className="h-6 w-auto object-contain"
                  />
                </Link>
              </div>
              <div className="text-xs">
                Operated by{" "}
                <Link
                  href="https://www.frescarealty.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--foreground)] hover:underline"
                >
                  FRESCA REALTY INC
                </Link>
                , California Real Estate Broker{" "}
                <span className="font-medium text-[var(--foreground)]">DRE #01835770</span>
              </div>
            </div>

            <nav className="flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:gap-x-3 text-[var(--foreground-muted)]">
              <Link
                href="/how-it-works"
                className="min-h-[44px] inline-flex items-center px-3 py-2 sm:min-h-0 sm:py-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
              >
                How it Works
              </Link>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <button
                type="button"
                onClick={() => setLegalModalOpen(true)}
                className="min-h-[44px] px-3 py-2 text-left sm:min-h-0 sm:py-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
              >
                Important Legal Notices &amp; Disclosures
              </button>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <Link
                href="/privacy-policy"
                className="min-h-[44px] inline-flex items-center px-3 py-2 sm:min-h-0 sm:py-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
              >
                Privacy Policy
              </Link>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <Link
                href="/terms"
                className="min-h-[44px] inline-flex items-center px-3 py-2 sm:min-h-0 sm:py-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
              >
                Terms of Service
              </Link>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <Link
                href="/aup"
                className="min-h-[44px] inline-flex items-center px-3 py-2 sm:min-h-0 sm:py-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
              >
                Acceptable Use Policy
              </Link>
              <span className="hidden sm:inline text-[var(--border)]">|</span>
              <Link
                href="/privacy-choices"
                className="min-h-[44px] inline-flex items-center gap-1 px-3 py-2 sm:min-h-0 sm:py-0 text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:underline"
              >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-[#2563eb] text-[0.6rem] font-semibold text-[#2563eb]"
                  >
                    ✓
                  </span>
                  <span>Your California Privacy Choices</span>
                </Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Important Legal Notices & Disclosures modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        aria-hidden={!legalModalOpen}
        className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-opacity duration-200 ${
          legalModalOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={closeModal}
      >
        <div
          className="kalshi-border max-h-[90vh] w-[95%] max-w-lg overflow-y-auto rounded-lg bg-[var(--background-elevated)] p-4 sm:p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="legal-modal-title" className="mb-4 text-lg font-semibold text-[var(--foreground)]">
            Important Legal Notices &amp; Disclosures
          </h2>
          <div className="space-y-4 text-sm text-[var(--foreground-muted)]">
            <p>
              <strong className="text-[var(--foreground)]">Notice of Non-Agency:</strong> HomePosal
              is a hosting venue for market interest. Properties are not currently listed; we do
              not represent these owners.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Agency Status:</strong> If an owner
              engages, a formal agency agreement may be required for transactions.
            </p>
            <p>
              <strong className="text-[var(--foreground)]">Data Privacy:</strong> We comply with
              CCPA/CPRA; we do not sell your personal information.{" "}
              <Link
                href="/privacy-policy"
                className="text-[var(--accent)] hover:underline"
                onClick={closeModal}
              >
                Privacy Policy
              </Link>
            </p>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={closeModal}
              className="min-h-[44px] rounded-md border border-[var(--border)] bg-transparent px-4 py-2 text-base font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

