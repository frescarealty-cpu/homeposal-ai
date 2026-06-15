"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LegalDocumentModal, type LegalDocumentType } from "@/components/LegalDocumentModal";
import { parseDollarInput, formatDollarDisplay } from "@/lib/formatDollarInput";
import { submitProposal } from "@/lib/actions/submitProposal";
import { submitPlaceProposal } from "@/lib/actions/submitPlaceProposal";

const FINANCING_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "conventional", label: "Conventional" },
  { value: "fha", label: "FHA" },
  { value: "va", label: "VA" },
  { value: "other", label: "Other" },
] as const;

const CONTACT_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },
  { value: "phone", label: "Phone" },
] as const;

type PlaceOfferFormProps = {
  propertyId?: string;
  listPriceCents?: number;
  initialAmount?: string;
  isLoggedIn: boolean;
  redirectPath: string;
  placeAddress?: string;
  placeLat?: number;
  placeLng?: number;
  zillowLookupAddress?: string;
  zillowLookupLat?: number;
  zillowLookupLng?: number;
};

function classifyHomeStatus(homeStatus: string | null | undefined) {
  const s = (homeStatus ?? "").trim().toUpperCase();
  if (!s) return { isListed: false, maybeListed: true };
  if (s === "OTHER" || s.includes("OFF_MARKET") || s === "SOLD" || s.includes("RECENTLY_SOLD")) {
    return { isListed: false, maybeListed: false };
  }
  if (
    s.includes("FOR_SALE") ||
    s.includes("PENDING") ||
    s.includes("COMING_SOON") ||
    s.includes("CONTINGENT") ||
    s.includes("UNDER_CONTRACT") ||
    s.includes("UNDER CONTRACT")
  ) {
    return { isListed: true, maybeListed: false };
  }
  return { isListed: false, maybeListed: true };
}

function closingDateFromDesiredDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, Math.floor(days)));
  return d.toISOString().slice(0, 10);
}

export function PlaceOfferForm({
  propertyId,
  listPriceCents: _listPriceCents = 0,
  initialAmount,
  isLoggedIn,
  redirectPath,
  placeAddress,
  placeLat = 0,
  placeLng = 0,
  zillowLookupAddress,
  zillowLookupLat,
  zillowLookupLng,
}: PlaceOfferFormProps) {
  const router = useRouter();
  const isPlaceMode = !!(placeAddress && typeof placeLat === "number" && typeof placeLng === "number");
  const lookupAddressRaw = (zillowLookupAddress ?? (isPlaceMode ? placeAddress : null) ?? "").trim();

  const [listing, setListing] = useState<{
    isListed: boolean;
    maybeListed: boolean;
    homeStatus: string | null;
    zillowUrl: string | null;
  }>({
    isListed: false,
    maybeListed: false,
    homeStatus: null,
    zillowUrl: null,
  });

  const [amount, setAmount] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [financingType, setFinancingType] = useState<string>("conventional");
  const [proofOfFunds, setProofOfFunds] = useState("");
  const [prequalLetter, setPrequalLetter] = useState("");
  const [daysToClose, setDaysToClose] = useState("30");
  const [preferredContactMethod, setPreferredContactMethod] = useState<"" | "email" | "text" | "phone">("");
  const [notes, setNotes] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialAmount == null || String(initialAmount).trim() === "") return;
    setAmount(formatDollarDisplay(String(initialAmount).replace(/\D/g, "")));
  }, [initialAmount]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!lookupAddressRaw) return;
      try {
        const addr = lookupAddressRaw.replace(/,\s*(usa|united states)$/i, "").trim();
        const sRes = await fetch(
          `/api/zillow/listing-status?${new URLSearchParams({ address: addr }).toString()}`,
          { cache: "no-store" }
        );
        const sJson = (await sRes.json().catch(() => null)) as
          | { ok: true; data: { homeStatus: string; zillowUrl: string } }
          | { ok?: false; error?: string }
          | null;

        if (!cancelled && sRes.ok && sJson?.ok === true) {
          const cls = classifyHomeStatus(sJson.data.homeStatus);
          setListing({
            isListed: cls.isListed,
            maybeListed: cls.maybeListed,
            homeStatus: sJson.data.homeStatus,
            zillowUrl: sJson.data.zillowUrl,
          });
        }
      } catch {
        if (!cancelled) {
          setListing({ isListed: false, maybeListed: false, homeStatus: null, zillowUrl: null });
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [lookupAddressRaw]);

  const amountNum = parseDollarInput(amount);
  const downPaymentNum = parseDollarInput(downPayment);
  const loanAmountCents = useMemo(() => {
    if (financingType === "cash") return 0;
    if (amountNum <= 0) return null;
    if (downPaymentNum < 0) return null;
    const cents = Math.round(amountNum * 100) - Math.round(downPaymentNum * 100);
    return cents > 0 ? cents : 0;
  }, [amountNum, downPaymentNum, financingType]);

  const loanDisplay = useMemo(() => {
    if (loanAmountCents == null) return "";
    return formatDollarDisplay(String(Math.round(loanAmountCents / 100)));
  }, [loanAmountCents]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (listing.isListed) {
      setError("Proposals are disabled while an active Zillow listing is detected.");
      return;
    }

    if (!isPlaceMode && !propertyId) {
      setError("Missing property. Please reload and try again.");
      return;
    }

    const offerAmountCents = Math.round(amountNum * 100);
    if (!offerAmountCents || offerAmountCents <= 0) {
      setError("Please enter a valid proposal amount.");
      return;
    }

    if (downPaymentNum < 0) {
      setError("Down payment cannot be negative.");
      return;
    }
    if (Math.round(downPaymentNum * 100) > offerAmountCents) {
      setError("Down payment cannot be greater than the proposal amount.");
      return;
    }

    const downPaymentCents = Math.round(downPaymentNum * 100);
    if (financingType !== "cash" && downPaymentCents <= 0) {
      setError("Please enter a down payment (required for financed offers).");
      return;
    }
    if (financingType === "cash" && downPaymentCents <= 0) {
      setError("For a cash offer, enter the full amount as the down payment (same as your proposal amount).");
      return;
    }

    if (!proofOfFunds || (proofOfFunds !== "yes" && proofOfFunds !== "no")) {
      setError("Please select whether you can provide proof of funds.");
      return;
    }
    if (!prequalLetter || (prequalLetter !== "yes" && prequalLetter !== "no")) {
      setError("Please select whether you have a prequal / pre-approval letter.");
      return;
    }

    const daysNum = Math.max(1, Math.floor(parseFloat(daysToClose) || 0));
    if (!Number.isFinite(daysNum) || daysNum < 1) {
      setError("Please enter desired days to close (at least 1).");
      return;
    }

    if (!preferredContactMethod) {
      setError("Please select your preferred method of contact for verification.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Notice at Collection and Terms of Use.");
      return;
    }

    const closingDate = closingDateFromDesiredDays(daysNum);
    const acceptedTermsAt = new Date().toISOString();
    const loanCentsForSubmit =
      financingType === "cash" ? 0 : loanAmountCents != null && loanAmountCents > 0 ? loanAmountCents : null;

    setLoading(true);
    try {
      if (isPlaceMode) {
        const result = await submitPlaceProposal(
          {
            placeAddress: placeAddress!,
            placeLat,
            placeLng,
            offerAmountCents,
            financingType,
            closingDate,
            acceptedTerms: true,
            acceptedTermsAt,
            desiredDaysToClose: daysNum,
            fullNotes: notes.trim() || null,
            loanAmountCents: loanCentsForSubmit,
            loanType: null,
            downPaymentCents: downPaymentCents > 0 ? downPaymentCents : null,
            proofOfFunds: proofOfFunds === "yes",
            prequalLetter: prequalLetter === "yes",
            preferredContactMethod,
          },
          redirectPath
        );
        if (result.success) {
          router.push(
            `/proposal/confirmation?type=place&redirect=${encodeURIComponent(redirectPath)}`
          );
          return;
        }
        setError(result.error);
        return;
      }

      const result = await submitProposal(
        {
          propertyId: propertyId!,
          offerAmountCents,
          financingType,
          closingDate,
          acceptedTerms: true,
          acceptedTermsAt,
          desiredDaysToClose: daysNum,
          fullNotes: notes.trim() || null,
          loanAmountCents: loanCentsForSubmit,
          loanType: null,
          downPaymentCents: downPaymentCents > 0 ? downPaymentCents : null,
          proofOfFunds: proofOfFunds === "yes",
          prequalLetter: prequalLetter === "yes",
          preferredContactMethod,
        },
        redirectPath
      );

      if (result.success) {
        router.push(
          `/proposal/confirmation?redirect=${encodeURIComponent(redirectPath)}`
        );
        return;
      }
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
    return (
      <div className="space-y-3 p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Make Proposal</h3>
        <p className="text-sm text-[var(--foreground-muted)]">
          Sign in or create an account to make a proposal{isPlaceMode ? " on this address" : " on this property"}.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={loginUrl}
            className="block min-h-[44px] rounded-md bg-[var(--success)] px-4 py-3 text-center text-base font-medium text-white hover:opacity-90"
          >
            Log In to Propose
          </Link>
          <Link
            href={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
            className="block min-h-[44px] rounded-md border border-[var(--border)] px-4 py-3 text-center text-base font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">Make Proposal</h3>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
        All fields marked (Required) must be completed. Your proposal is reviewed before it appears publicly.
      </p>

      {listing.isListed && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3 text-sm text-[var(--foreground-muted)]">
          <p className="font-medium text-[var(--foreground)]">Listed on Zillow</p>
          {listing.homeStatus && (
            <p className="mt-1">
              Status:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {listing.homeStatus.replace(/_/g, " ")}
              </span>
            </p>
          )}
          <p className="mt-1">Proposals are disabled while an active Zillow listing is detected.</p>
          {listing.zillowUrl && (
            <Link
              href={listing.zillowUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex min-h-[36px] items-center font-medium text-[var(--accent)] hover:underline"
            >
              View listing on Zillow
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="proposal-amount" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Proposal amount <span className="text-red-500">(Required)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
            <input
              id="proposal-amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={amount}
              onChange={(e) => setAmount(formatDollarDisplay(e.target.value))}
              placeholder="Enter amount"
              disabled={listing.isListed}
              className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 pl-7 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="down-payment" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Down Payment <span className="text-red-500">(Required)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
            <input
              id="down-payment"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={downPayment}
              onChange={(e) => setDownPayment(formatDollarDisplay(e.target.value))}
              placeholder="Enter down payment"
              disabled={listing.isListed}
              className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 pl-7 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="loan-amount" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Loan Amount (auto-calculated)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
            <input
              id="loan-amount"
              type="text"
              readOnly
              value={loanDisplay}
              placeholder="—"
              className="kalshi-border w-full cursor-not-allowed rounded-md border border-[var(--border)] bg-[var(--background-elevated)] py-2.5 pl-7 pr-3 text-sm text-[var(--foreground-muted)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="financing-type" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Financing type <span className="text-red-500">(Required)</span>
          </label>
          <select
            id="financing-type"
            value={financingType}
            onChange={(e) => setFinancingType(e.target.value)}
            disabled={listing.isListed}
            className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)]"
            required
          >
            {FINANCING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proof-of-funds" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Can provide proof of funds <span className="text-red-500">(Required)</span>
          </label>
          <select
            id="proof-of-funds"
            value={proofOfFunds}
            onChange={(e) => setProofOfFunds(e.target.value)}
            disabled={listing.isListed}
            className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)]"
            required
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label htmlFor="prequal-letter" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Prequal / pre-approval letter <span className="text-red-500">(Required)</span>
          </label>
          <select
            id="prequal-letter"
            value={prequalLetter}
            onChange={(e) => setPrequalLetter(e.target.value)}
            disabled={listing.isListed}
            className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)]"
            required
          >
            <option value="">Select</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label htmlFor="days-to-close" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Desired days to close <span className="text-red-500">(Required)</span>
          </label>
          <input
            id="days-to-close"
            type="number"
            min={1}
            step={1}
            value={daysToClose}
            onChange={(e) => setDaysToClose(e.target.value)}
            disabled={listing.isListed}
            className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label htmlFor="preferred-contact" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Preferred Method of Contact For Verification <span className="text-red-500">(Required)</span>
          </label>
          <select
            id="preferred-contact"
            value={preferredContactMethod}
            onChange={(e) =>
              setPreferredContactMethod(e.target.value as "email" | "text" | "phone" | "")
            }
            disabled={listing.isListed}
            className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)]"
            required
          >
            <option value="">Select</option>
            {CONTACT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proposal-notes" className="mb-1 block text-xs text-[var(--foreground-muted)]">
            Notes (private, not shown publicly)
          </label>
          <textarea
            id="proposal-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            disabled={listing.isListed}
            placeholder="Optional message for the seller"
            className="kalshi-border w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2.5 px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
          />
        </div>

        <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--foreground-muted)]">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={listing.isListed}
          />
          <span>
            I have read and accept the{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLegalModal("notice");
              }}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              Notice at Collection
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLegalModal("terms");
              }}
              className="font-medium text-[var(--accent)] hover:underline"
            >
              Terms of Use
            </button>
            .
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading || listing.isListed}
          className="h-auto min-h-[44px] w-full bg-[var(--success)] py-3 text-base font-medium text-white hover:bg-[var(--success)] hover:opacity-90"
        >
          {loading ? "Submitting…" : "Make Proposal"}
        </Button>
      </form>

      {legalModal && (
        <LegalDocumentModal documentType={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}
