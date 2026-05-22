"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTransition } from "react";
import type { MyProposal, MyPlaceProposal } from "@/lib/actions/getMyProposals";
import { withdrawProposal, withdrawPlaceProposal } from "@/lib/actions/withdrawProposal";
import type { ExportColumn, ProposalsExportFormat } from "@/lib/export/exportProposals";
import { exportRowsToSpreadsheet } from "@/lib/export/exportProposals";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending approval",
    approved: "Active",
    accepted: "Accepted",
    rejected: "Rejected",
    expired: "Expired",
    withdrawn: "Withdrawn",
  };
  return map[status] ?? status;
}

function statusClass(status: string): string {
  if (status === "approved") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (status === "pending") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  if (status === "expired" || status === "rejected") return "bg-red-500/15 text-red-600 dark:text-red-400";
  if (status === "withdrawn") return "bg-[var(--foreground-muted)]/15 text-[var(--foreground-muted)]";
  return "bg-[var(--border-subtle)] text-[var(--foreground-muted)]";
}

const canWithdraw = (status: string) => status === "pending" || status === "approved";
const canEdit = (status: string) => status === "pending" || status === "approved";

type Props = {
  proposals: MyProposal[];
  placeProposals: MyPlaceProposal[];
};

export function MyProposalsDashboard({ proposals = [], placeProposals = [] }: Props) {
  const [isPending, startTransition] = useTransition();
  const safeProposals = Array.isArray(proposals) ? proposals : [];
  const safePlaceProposals = Array.isArray(placeProposals) ? placeProposals : [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "approved" | "accepted" | "rejected" | "expired" | "withdrawn"
  >("all");

  const [exportFormat, setExportFormat] = useState<ProposalsExportFormat>("csv");
  const [exportLoading, setExportLoading] = useState(false);

  const handleWithdraw = (id: string, type: "property" | "place") => {
    startTransition(async () => {
      const result =
        type === "property" ? await withdrawProposal(id) : await withdrawPlaceProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  };

  const renderProposalFields = (p: MyProposal | MyPlaceProposal) => (
    <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-[var(--foreground-muted)]">Offer amount</dt>
        <dd className="font-tabular text-[var(--success)]">{formatCurrency(p.offer_amount_cents)}</dd>
      </div>
      <div>
        <dt className="text-[var(--foreground-muted)]">Financing</dt>
        <dd className="capitalize">{p.financing_type}</dd>
      </div>
      <div>
        <dt className="text-[var(--foreground-muted)]">Desired days to close</dt>
        <dd>{p.desired_days_to_close != null ? p.desired_days_to_close : Math.max(0, Math.round((new Date(p.closing_date).getTime() - new Date(p.created_at).getTime()) / (24 * 60 * 60 * 1000)))} days</dd>
      </div>
      {p.loan_amount_cents != null && p.loan_amount_cents > 0 && (
        <div>
          <dt className="text-[var(--foreground-muted)]">Loan amount</dt>
          <dd className="font-tabular">{formatCurrency(p.loan_amount_cents)}</dd>
        </div>
      )}
      {p.loan_type && (
        <div>
          <dt className="text-[var(--foreground-muted)]">Loan type</dt>
          <dd>{p.loan_type === "fixed" ? "Fixed Rate" : "Adjustable Rate"}</dd>
        </div>
      )}
      {p.down_payment_cents != null && p.down_payment_cents > 0 && (
        <div>
          <dt className="text-[var(--foreground-muted)]">Down payment</dt>
          <dd className="font-tabular">{formatCurrency(p.down_payment_cents)}</dd>
        </div>
      )}
      {p.full_notes && (
        <div className="sm:col-span-2">
          <dt className="text-[var(--foreground-muted)]">Notes</dt>
          <dd className="mt-0.5 text-[var(--foreground-muted)]">{p.full_notes}</dd>
        </div>
      )}
      <div>
        <dt className="text-[var(--foreground-muted)]">Submitted</dt>
        <dd>{formatDate(p.created_at)}</dd>
      </div>
    </dl>
  );

  const allProposals = useMemo(() => {
    return [
      ...safeProposals.map((p) => ({ ...p, type: "property" as const })),
      ...safePlaceProposals.map((p) => ({ ...p, type: "place" as const })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [safeProposals, safePlaceProposals]);

  const filteredProposals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProposals.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;

      const title =
        p.type === "property"
          ? `property ${(p as MyProposal).property_id}`
          : (p as MyPlaceProposal).place_address;

      return title.toLowerCase().includes(q);
    });
  }, [allProposals, query, statusFilter]);

  const exportColumns: ExportColumn<Record<string, unknown>>[] = [
    { key: "proposal_type", label: "Proposal Type" },
    { key: "id", label: "Proposal ID" },
    { key: "property_or_place", label: "Property / Place" },
    { key: "status", label: "Status" },
    { key: "offer_amount_cents", label: "Offer Amount (cents)" },
    { key: "financing_type", label: "Financing Type" },
    { key: "closing_date", label: "Closing Date" },
    { key: "desired_days_to_close", label: "Desired Days to Close" },
    { key: "proof_of_funds", label: "Proof of Funds" },
    { key: "prequal_letter", label: "Prequal Letter" },
    { key: "loan_amount_cents", label: "Loan Amount (cents)" },
    { key: "loan_type", label: "Loan Type" },
    { key: "down_payment_cents", label: "Down Payment (cents)" },
    { key: "full_notes", label: "Notes" },
    { key: "created_at", label: "Created At" },
  ];

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const rows: Record<string, unknown>[] = filteredProposals.map((p) => {
        const propertyOrPlace =
          p.type === "property" ? (p as MyProposal).property_id : (p as MyPlaceProposal).place_address;

        return {
          proposal_type: p.type,
          id: p.id,
          property_or_place: propertyOrPlace,
          status: p.status,
          offer_amount_cents: p.offer_amount_cents,
          financing_type: p.financing_type,
          closing_date: p.closing_date,
          desired_days_to_close: p.desired_days_to_close,
          proof_of_funds: (p as MyProposal | MyPlaceProposal).proof_of_funds,
          prequal_letter: (p as MyProposal | MyPlaceProposal).prequal_letter,
          loan_amount_cents: p.loan_amount_cents ?? null,
          loan_type: p.loan_type ?? null,
          down_payment_cents: p.down_payment_cents ?? null,
          full_notes: p.full_notes ?? null,
          created_at: p.created_at,
        };
      });

      await exportRowsToSpreadsheet({
        rows,
        columns: exportColumns,
        format: exportFormat,
        filenameBase: "my-proposals",
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (allProposals.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-8 text-center">
        <p className="text-[var(--foreground-muted)]">You haven’t submitted any proposals yet.</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-[var(--success)] hover:underline"
        >
          Browse properties and make a proposal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Your proposals</h2>
          <p className="text-sm text-[var(--foreground-muted)]">
            If you edit an offer, it must be approved again by our team before it is posted publicly. Revised offers will show as &quot;Pending approval&quot; until then.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by address…"
            className="min-h-[40px] w-[220px] max-w-full rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            aria-label="Search proposals"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="min-h-[40px] rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending approval</option>
            <option value="approved">Active</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ProposalsExportFormat)}
            className="min-h-[40px] rounded-full border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#2C56A3]/40"
            aria-label="Export format"
          >
            <option value="csv">CSV</option>
            <option value="tsv">TSV</option>
            <option value="json">JSON</option>
            <option value="xlsx">XLSX</option>
            <option value="xls">XLS</option>
          </select>
          <button
            type="button"
            disabled={exportLoading}
            onClick={() => void handleExport()}
            className="min-h-[40px] rounded-full bg-[#2C56A3] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {exportLoading ? "Exporting…" : "Export"}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStatusFilter("all");
            }}
            className="min-h-[40px] rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
          >
            Clear
          </button>
        </div>
      </div>
      <p className="text-xs text-[var(--foreground-muted)]">
        Showing {filteredProposals.length} of {allProposals.length}
      </p>
      <ul className="space-y-4">
        {filteredProposals.map((p) => (
          <li
            key={p.type === "property" ? p.property_id + p.id : p.place_address + p.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                {p.type === "property" ? (
                  <Link
                    href={`/property/${(p as MyProposal).property_id}`}
                    className="font-medium text-[var(--foreground)] hover:underline"
                  >
                    Property · {(p as MyProposal).property_id.slice(0, 8)}…
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--foreground)]">
                    {(p as MyPlaceProposal).place_address}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass(p.status)}`}>
                  {statusLabel(p.status)}
                </span>
                {canEdit(p.status) && (
                  <Link
                    href={`/dashboard/edit?id=${encodeURIComponent(p.id)}&type=${p.type}`}
                    className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
                  >
                    Edit
                  </Link>
                )}
                {canWithdraw(p.status) && (
                  <button
                    type="button"
                    onClick={() => handleWithdraw(p.id, p.type)}
                    disabled={isPending}
                    className="rounded-md border border-red-500/50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
            {renderProposalFields(p)}
            {p.type === "property" ? (
              <Link
                href={`/property/${(p as MyProposal).property_id}`}
                className="mt-3 inline-block text-sm font-medium text-[var(--success)] hover:underline"
              >
                View property detail page →
              </Link>
            ) : (
              <Link
                href={`/place?address=${encodeURIComponent((p as MyPlaceProposal).place_address)}&lat=${(p as MyPlaceProposal).place_lat}&lng=${(p as MyPlaceProposal).place_lng}`}
                className="mt-3 inline-block text-sm font-medium text-[var(--success)] hover:underline"
              >
                View property detail page →
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
