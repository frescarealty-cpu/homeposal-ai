"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { NoticeAtCollectionContent } from "@/components/legal/NoticeAtCollectionContent";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { MODAL_OVERLAY_CLASS } from "@/lib/modalLayer";

export type LegalDocumentType = "notice" | "terms";

const TITLES: Record<LegalDocumentType, string> = {
  notice: "Notice at Collection",
  terms: "Terms of Service",
};

type LegalDocumentModalProps = {
  documentType: LegalDocumentType;
  onClose: () => void;
};

export function LegalDocumentModal({ documentType, onClose }: LegalDocumentModalProps) {
  const title = TITLES[documentType];
  const titleId = `legal-document-${documentType}-title`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 flex items-start justify-center overflow-y-auto p-4 sm:items-center ${MODAL_OVERLAY_CLASS}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-xl kalshi-border">
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {documentType === "notice" ? (
            <NoticeAtCollectionContent />
          ) : (
            <TermsOfServiceContent openLinksInNewTab />
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-[var(--border)] px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-md border border-[var(--border)] bg-transparent px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
