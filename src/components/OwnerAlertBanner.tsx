import { AlertCircle } from "lucide-react";
import { ContactInviteLink } from "@/components/ContactInviteLink";

type OwnerAlertBannerProps = {
  ownerInquiryPhone?: string;
  className?: string;
};

export function OwnerAlertBanner({
  ownerInquiryPhone = "760-123-4560",
  className = "",
}: OwnerAlertBannerProps) {
  return (
    <div
      role="note"
      aria-label="Owner Alert"
      className={[
        "rounded-lg border border-[var(--border)] border-l-2 border-l-blue-400 bg-[var(--foreground)]/[0.03] px-3 py-3 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-1.5">
        <AlertCircle
          className="h-3.5 w-3.5 shrink-0 text-[#1C4482]"
          strokeWidth={2}
          aria-hidden
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1C4482]">
          Owner Alert
        </p>
      </div>
      <p className="mt-1 text-sm font-semibold tracking-tight text-[var(--foreground)]">
        Are you the owner and want more information on a proposal?
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <ContactInviteLink
          contactType="owner-proposal"
          className="inline-flex min-h-[40px] items-center justify-center rounded-md bg-[#1C4482] px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          Get More Info
        </ContactInviteLink>
        <a
          href={`tel:${ownerInquiryPhone}`}
          className="inline-flex min-h-[40px] items-center justify-center rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border-subtle)]"
        >
          Call {ownerInquiryPhone}
        </a>
      </div>
    </div>
  );
}
