import { BadgeCheck } from "lucide-react";

const VERIFICATION_TOOLTIP =
  "Proof of funds and pre-approval were reviewed by FRESCA REALTY INC (DRE #01835770) before this proposal was published. This is not a loan approval or guarantee of closing.";

type VerifiedProposalBadgeProps = {
  compact?: boolean;
  className?: string;
};

export function VerifiedProposalBadge({ compact = false, className = "" }: VerifiedProposalBadgeProps) {
  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium leading-tight text-emerald-800 dark:text-emerald-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={VERIFICATION_TOOLTIP}
    >
      <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
      <span>{compact ? "Verified" : "Verified Proposal"}</span>
    </span>
  );
}

export function VerifiedProposalFootnote({ className = "" }: { className?: string }) {
  return (
    <p className={["text-xs leading-relaxed text-[var(--foreground-muted)]", className].filter(Boolean).join(" ")}>
      <strong className="font-medium text-[var(--foreground)]">Verified Proposal:</strong> documentation
      reviewed by FRESCA REALTY INC (DRE #01835770) before publication. Not a guarantee of closing.
    </p>
  );
}
