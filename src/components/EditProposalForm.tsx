"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProposal, updatePlaceProposal } from "@/lib/actions/updateProposal";
import type { UpdateProposalInput } from "@/lib/actions/updateProposal";
import type { MyProposal, MyPlaceProposal } from "@/lib/actions/getMyProposals";
import { parseDollarInput, formatDollarDisplay } from "@/lib/formatDollarInput";

const FINANCING_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "conventional", label: "Conventional" },
  { value: "fha", label: "FHA" },
  { value: "va", label: "VA" },
  { value: "other", label: "Other" },
] as const;

type Props = {
  proposal: MyProposal | MyPlaceProposal;
};

function daysFromOfferToClosing(createdAt: string, closingDate: string): number {
  const start = new Date(createdAt).getTime();
  const end = new Date(closingDate).getTime();
  return Math.max(0, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

function daysToClosingDate(createdAt: string, days: number): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + Math.max(0, Math.floor(days)));
  return d.toISOString().slice(0, 10);
}

export function EditProposalForm({ proposal }: Props) {
  const isPlace = proposal.type === "place";
  const [amount, setAmount] = useState(() =>
    formatDollarDisplay(String(Math.round(proposal.offer_amount_cents / 100)))
  );
  const [financingType, setFinancingType] = useState(proposal.financing_type);
  const [daysToClose, setDaysToClose] = useState(
    proposal.desired_days_to_close != null
      ? String(proposal.desired_days_to_close)
      : String(daysFromOfferToClosing(proposal.created_at, proposal.closing_date))
  );
  const [notes, setNotes] = useState(proposal.full_notes ?? "");
  const [downPayment, setDownPayment] = useState(() =>
    proposal.down_payment_cents != null
      ? formatDollarDisplay(String(Math.round(proposal.down_payment_cents / 100)))
      : ""
  );
  const [proofOfFunds, setProofOfFunds] = useState<string>(
    proposal.proof_of_funds === true ? "yes" : proposal.proof_of_funds === false ? "no" : ""
  );
  const [prequalLetter, setPrequalLetter] = useState<string>(
    proposal.prequal_letter === true ? "yes" : proposal.prequal_letter === false ? "no" : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseDollarInput(amount);
  const downPaymentNum = parseDollarInput(downPayment);
  const loanAmountCents =
    amountNum > 0 && amountNum > downPaymentNum
      ? Math.round((amountNum - downPaymentNum) * 100)
      : null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(amountNum * 100);
    if (!amountCents || amountCents <= 0) {
      setError("Please enter a valid proposal amount.");
      return;
    }
    setLoading(true);
    setError(null);

    const daysNum = Math.max(0, Math.floor(parseFloat(daysToClose) || 0));
    const closingDate = daysToClosingDate(proposal.created_at, daysNum);
    const loanTypeValue: UpdateProposalInput["loanType"] =
      proposal.loan_type === "fixed" || proposal.loan_type === "adjustable"
        ? proposal.loan_type
        : null;
    const input: UpdateProposalInput = {
      offerAmountCents: amountCents,
      financingType,
      closingDate,
      desiredDaysToClose: daysNum,
      fullNotes: notes.trim() || null,
      loanAmountCents,
      loanType: loanTypeValue,
      downPaymentCents: downPaymentNum > 0 ? Math.round(downPaymentNum * 100) : null,
      proofOfFunds: proofOfFunds === "yes" ? true : proofOfFunds === "no" ? false : null,
      prequalLetter: prequalLetter === "yes" ? true : prequalLetter === "no" ? false : null,
    };

    try {
      const result = isPlace
        ? await updatePlaceProposal(proposal.id, input)
        : await updateProposal(proposal.id, input);

      if (result.success) {
        window.location.href = "/dashboard?revised=1";
        return;
      }
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 px-4 py-2 text-sm text-red-500">{error}</div>
      )}

      <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--background)] p-3 text-sm text-[var(--foreground-muted)]">
        {isPlace ? (
          <span>{(proposal as MyPlaceProposal).place_address}</span>
        ) : (
          <span>Property · {(proposal as MyProposal).property_id.slice(0, 8)}…</span>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Proposal amount <span className="text-red-500">(Required)</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
          <input
            id="amount"
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatDollarDisplay(e.target.value))}
            className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 pl-8 pr-4 font-tabular text-[var(--foreground)]"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="downPayment" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Down payment
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">$</span>
          <input
            id="downPayment"
            type="text"
            inputMode="numeric"
            value={downPayment}
            onChange={(e) => setDownPayment(formatDollarDisplay(e.target.value))}
            placeholder="0"
            className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 pl-8 pr-4 font-tabular text-[var(--foreground)]"
          />
        </div>
      </div>

      <div>
        <label htmlFor="financing" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Financing type
        </label>
        <select
          id="financing"
          value={financingType}
          onChange={(e) => setFinancingType(e.target.value)}
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
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
        <label htmlFor="proofOfFunds" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Can provide proof of funds <span className="text-red-500">(Required)</span>
        </label>
        <select
          id="proofOfFunds"
          value={proofOfFunds}
          onChange={(e) => setProofOfFunds(e.target.value)}
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <div>
        <label htmlFor="prequalLetter" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Prequal / pre-approval letter <span className="text-red-500">(Required)</span>
        </label>
        <select
          id="prequalLetter"
          value={prequalLetter}
          onChange={(e) => setPrequalLetter(e.target.value)}
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
        >
          <option value="">Select</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>

      <div>
        <label htmlFor="daysToClose" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Desired days to close
        </label>
        <input
          id="daysToClose"
          type="number"
          min={1}
          step={1}
          value={daysToClose}
          onChange={(e) => setDaysToClose(e.target.value)}
          placeholder="e.g. 30"
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 font-tabular text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-xs text-[var(--foreground-muted)]">
          Notes (private)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
