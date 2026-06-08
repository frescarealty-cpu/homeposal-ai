"use client";

import { approveProposal, approvePlaceProposal, rejectProposal, rejectPlaceProposal, cancelProposal, cancelPlaceProposal } from "@/lib/actions/approveProposal";
import { useTransition, useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { ExportColumn, ProposalsExportFormat } from "@/lib/export/exportProposals";
import { exportRowsToSpreadsheet } from "@/lib/export/exportProposals";

type ProfileInfo = { full_name: string; email: string | null; phone: string | null; role: string };

type Proposal = {
  id: string;
  property_id: string;
  user_id: string;
  status: string;
  offer_amount_cents: number;
  financing_type: string;
  closing_date: string;
  full_notes?: string | null;
  loan_amount_cents?: number | null;
  loan_type?: string | null;
  down_payment_cents?: number | null;
  proof_of_funds?: boolean | null;
  prequal_letter?: boolean | null;
  preferred_contact_method?: string | null;
  desired_days_to_close?: number | null;
  created_at: string;
};

type PlaceProposal = {
  id: string;
  place_address: string;
  place_lat?: number | null;
  place_lng?: number | null;
  user_id: string;
  status: string;
  offer_amount_cents: number;
  financing_type: string;
  closing_date: string;
  full_notes?: string | null;
  loan_amount_cents?: number | null;
  loan_type?: string | null;
  down_payment_cents?: number | null;
  proof_of_funds?: boolean | null;
  prequal_letter?: boolean | null;
  preferred_contact_method?: string | null;
  desired_days_to_close?: number | null;
  created_at: string;
};

export function AdminProposalsList({
  proposals = [],
  placeProposals = [],
  profileByUserId = {},
}: {
  proposals?: Proposal[];
  placeProposals?: PlaceProposal[];
  profileByUserId?: Record<string, ProfileInfo>;
}) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "cancelled">("all");
  const [exportFormat, setExportFormat] = useState<ProposalsExportFormat>("csv");
  const [exportLoading, setExportLoading] = useState(false);

  const safeProposals = Array.isArray(proposals) ? proposals : [];
  const safePlaceProposals = Array.isArray(placeProposals) ? placeProposals : [];
  const safeProfileByUserId = profileByUserId && typeof profileByUserId === "object" ? profileByUserId : {};

  const matchesUserSearch = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return () => true;

    return (userId: string) => {
      const profile = safeProfileByUserId[userId];
      if (!profile) return false;
      const roleLabel = profile.role.replace(/_/g, " ");
      const haystack = [profile.full_name, profile.email, profile.phone, profile.role, roleLabel]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    };
  }, [userSearch, safeProfileByUserId]);

  const filteredProposals = useMemo(() => {
    let list = safeProposals;
    if (statusFilter === "pending" || statusFilter === "approved") {
      list = list.filter((p) => p.status === statusFilter);
    } else if (statusFilter === "cancelled") {
      list = list.filter((p) => p.status === "withdrawn" || p.status === "rejected");
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => p.property_id.toLowerCase().includes(q));
    }
    list = list.filter((p) => matchesUserSearch(p.user_id));
    return list;
  }, [safeProposals, search, statusFilter, matchesUserSearch]);

  const filteredPlaceProposals = useMemo(() => {
    let list = safePlaceProposals;
    if (statusFilter === "pending" || statusFilter === "approved") {
      list = list.filter((p) => p.status === statusFilter);
    } else if (statusFilter === "cancelled") {
      list = list.filter((p) => p.status === "withdrawn" || p.status === "rejected");
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => (p.place_address ?? "").toLowerCase().includes(q));
    }
    list = list.filter((p) => matchesUserSearch(p.user_id));
    return list;
  }, [safePlaceProposals, search, statusFilter, matchesUserSearch]);

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
      const combinedRows: Record<string, unknown>[] = [
        ...filteredProposals.map((p) => ({
          proposal_type: "property",
          id: p.id,
          property_or_place: p.property_id,
          status: p.status,
          offer_amount_cents: p.offer_amount_cents,
          financing_type: p.financing_type,
          closing_date: p.closing_date,
          desired_days_to_close: p.desired_days_to_close ?? null,
          proof_of_funds: p.proof_of_funds ?? null,
          prequal_letter: p.prequal_letter ?? null,
          loan_amount_cents: p.loan_amount_cents ?? null,
          loan_type: p.loan_type ?? null,
          down_payment_cents: p.down_payment_cents ?? null,
          full_notes: p.full_notes ?? null,
          created_at: p.created_at,
        })),
        ...filteredPlaceProposals.map((p) => ({
          proposal_type: "place",
          id: p.id,
          property_or_place: p.place_address,
          status: p.status,
          offer_amount_cents: p.offer_amount_cents,
          financing_type: p.financing_type,
          closing_date: p.closing_date,
          desired_days_to_close: p.desired_days_to_close ?? null,
          proof_of_funds: p.proof_of_funds ?? null,
          prequal_letter: p.prequal_letter ?? null,
          loan_amount_cents: p.loan_amount_cents ?? null,
          loan_type: p.loan_type ?? null,
          down_payment_cents: p.down_payment_cents ?? null,
          full_notes: p.full_notes ?? null,
          created_at: p.created_at,
        })),
      ].sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());

      await exportRowsToSpreadsheet({
        rows: combinedRows,
        columns: exportColumns,
        format: exportFormat,
        filenameBase: "admin-proposals",
      });
    } finally {
      setExportLoading(false);
    }
  };

  function statusLabel(status: string) {
    if (status === "approved") return "Active";
    if (status === "withdrawn" || status === "rejected") return "Cancelled";
    return "Pending";
  }

  function statusBadgeClass(status: string) {
    if (status === "approved") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (status === "withdrawn" || status === "rejected") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  }

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  function formatRole(role: string) {
    return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function publicPlacePageHref(p: PlaceProposal): string | null {
    const lat = p.place_lat;
    const lng = p.place_lng;
    if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return `/place?address=${encodeURIComponent(p.place_address)}&lat=${lat}&lng=${lng}`;
  }

  function daysToCloseDisplay(p: Proposal | PlaceProposal) {
    if (p.desired_days_to_close != null) return p.desired_days_to_close;
    return Math.max(0, Math.round((new Date(p.closing_date).getTime() - new Date(p.created_at).getTime()) / (24 * 60 * 60 * 1000)));
  }

  function OfferSummary({ p }: { p: Proposal | PlaceProposal }) {
    const hasLoan = p.loan_amount_cents != null || p.loan_type || p.down_payment_cents != null;
    const proofVal = p.proof_of_funds != null ? (p.proof_of_funds ? "Yes" : "No") : null;
    const prequalVal = p.prequal_letter != null ? (p.prequal_letter ? "Yes" : "No") : null;
    return (
      <div className="mt-2 space-y-1 text-xs text-[var(--foreground-muted)]">
        <div>Offer: {formatCurrency(p.offer_amount_cents)} · {p.financing_type} · {daysToCloseDisplay(p)} days to close</div>
        {hasLoan && (
          <div>
            {p.loan_amount_cents != null && formatCurrency(p.loan_amount_cents)}
            {p.loan_type && ` · ${p.loan_type}`}
            {p.down_payment_cents != null && ` · Down ${formatCurrency(p.down_payment_cents)}`}
          </div>
        )}
        {(proofVal != null || prequalVal != null) && (
          <div>
            {proofVal != null && `Proof of funds: ${proofVal}`}
            {proofVal != null && prequalVal != null && " · "}
            {prequalVal != null && `Prequal letter: ${prequalVal}`}
          </div>
        )}
        {p.full_notes && (
          <div className="pt-1 border-t border-[var(--border-subtle)]">Notes: {p.full_notes}</div>
        )}
      </div>
    );
  }

  function formatPreferredContact(method: string | null | undefined) {
    if (!method) return "—";
    return method.charAt(0).toUpperCase() + method.slice(1);
  }

  function UserSummary({ userId, preferredContactMethod }: { userId: string; preferredContactMethod?: string | null }) {
    const profile = safeProfileByUserId[userId];
    if (!profile) return <div className="text-xs text-[var(--foreground-muted)]">—</div>;
    return (
      <div className="space-y-0.5 text-xs">
        <div className="font-medium text-[var(--foreground)]">{profile.full_name}</div>
        <div className="text-[var(--foreground-muted)]">Email: {profile.email ?? "—"}</div>
        <div className="text-[var(--foreground-muted)]">Phone: {profile.phone ?? "—"}</div>
        <div className="text-[var(--foreground-muted)]">Role: {formatRole(profile.role)}</div>
        <div className="text-[var(--foreground-muted)]">Preferred contact: {formatPreferredContact(preferredContactMethod)}</div>
      </div>
    );
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  function handleApprovePlace(id: string) {
    startTransition(async () => {
      const result = await approvePlaceProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  function handleReject(id: string) {
    if (!confirm("Reject this proposal? The proposer will receive an email that their proposal was not approved.")) return;
    startTransition(async () => {
      const result = await rejectProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  function handleRejectPlace(id: string) {
    if (!confirm("Reject this proposal? The proposer will receive an email that their proposal was not approved.")) return;
    startTransition(async () => {
      const result = await rejectPlaceProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  function handleCancel(id: string) {
    if (!confirm("Cancel this active proposal? It will be removed from the board and the proposer will be notified.")) return;
    startTransition(async () => {
      const result = await cancelProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  function handleCancelPlace(id: string) {
    if (!confirm("Cancel this active proposal? It will be removed from the board and the proposer will be notified.")) return;
    startTransition(async () => {
      const result = await cancelPlaceProposal(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.error);
      }
    });
  }

  const hasAny = safeProposals.length > 0 || safePlaceProposals.length > 0;

  if (!hasAny) {
    return (
      <>
        <p className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-6 text-sm text-[var(--foreground-muted)]">
          No proposals yet.
        </p>
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="admin-proposal-search" className="text-sm font-medium text-[var(--foreground-muted)] sm:shrink-0">
              Filter by property or address
            </label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                id="admin-proposal-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. property ID or address..."
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="admin-user-search" className="text-sm font-medium text-[var(--foreground-muted)] sm:shrink-0">
              Filter by user
            </label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
              <input
                id="admin-user-search"
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="e.g. name, email, or phone..."
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] py-2 pl-9 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="admin-status-filter" className="text-sm font-medium text-[var(--foreground-muted)] sm:shrink-0">
            Status
          </label>
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved" | "cancelled")}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="admin-export-format" className="text-sm font-medium text-[var(--foreground-muted)] sm:shrink-0">
            Export
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              id="admin-export-format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ProposalsExportFormat)}
              className="min-h-[40px] rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus:outline-none"
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
              className="min-h-[40px] rounded-md bg-[#2C56A3] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {exportLoading ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>
        </div>
      </div>

      {filteredProposals.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--foreground)]">
            Property proposals
          </h2>
          <div className="space-y-2">
            {filteredProposals.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(p.offer_amount_cents)} · {p.financing_type}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    Closing {p.closing_date} ·{" "}
                    <Link
                      href={`/property/${p.property_id}`}
                      className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                    >
                      Property {p.property_id.slice(0, 8)}…
                    </Link>
                  </div>
                  <div className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--background)] p-2">
                    <div className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">User</div>
                    <UserSummary userId={p.user_id} preferredContactMethod={p.preferred_contact_method} />
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Offer summary</div>
                    <OfferSummary p={p} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/property/${p.property_id}`}
                    className="text-sm text-[var(--accent)] hover:underline"
                  >
                    View property
                  </Link>
                  {p.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(p.id)}
                        disabled={isPending}
                        className="rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(p.id)}
                        disabled={isPending}
                        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => handleCancel(p.id)}
                      disabled={isPending}
                      className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {filteredPlaceProposals.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-[var(--foreground)]">
            Place proposals (address-only)
          </h2>
          <div className="space-y-2">
            {filteredPlaceProposals.map((p) => {
              const placeHref = publicPlacePageHref(p);
              return (
              <div
                key={p.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {placeHref ? (
                        <Link
                          href={placeHref}
                          className="text-[var(--foreground)] underline-offset-2 hover:text-[var(--accent)] hover:underline"
                        >
                          {p.place_address}
                        </Link>
                      ) : (
                        p.place_address
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--foreground-muted)]">
                    {formatCurrency(p.offer_amount_cents)} · {p.financing_type} · {daysToCloseDisplay(p)} days to close
                  </div>
                  <div className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--background)] p-2">
                    <div className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">User</div>
                    <UserSummary userId={p.user_id} preferredContactMethod={p.preferred_contact_method} />
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Offer summary</div>
                    <OfferSummary p={p} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {p.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprovePlace(p.id)}
                        disabled={isPending}
                        className="rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectPlace(p.id)}
                        disabled={isPending}
                        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => handleCancelPlace(p.id)}
                      disabled={isPending}
                      className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {hasAny &&
        (search.trim() || userSearch.trim()) &&
        filteredProposals.length === 0 &&
        filteredPlaceProposals.length === 0 && (
        <p className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-4 text-sm text-[var(--foreground-muted)]">
          No proposals match your filters
          {search.trim() && userSearch.trim()
            ? ` (property/address: "${search.trim()}", user: "${userSearch.trim()}")`
            : search.trim()
              ? ` for property or address "${search.trim()}"`
              : ` for user "${userSearch.trim()}"`}
          . Try different search terms.
        </p>
      )}
    </div>
  );
}
