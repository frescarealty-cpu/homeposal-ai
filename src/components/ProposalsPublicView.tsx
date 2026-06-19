"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Info, Mail, Phone } from "lucide-react";
import { ContactInviteLink } from "@/components/ContactInviteLink";
import { OwnerAlertBanner } from "@/components/OwnerAlertBanner";
import type { ProposalPublic } from "@/types/proposals";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type ProposalsPublicViewProps = {
  proposals: ProposalPublic[];
  listPriceCents?: number;
  bestOfferCents?: number;
  offerDeadline?: string;
  enableInquiry?: boolean;
  inquiryAddressLabel?: string;
  showOwnerAlertBanner?: boolean;
  ownerInquiryPhone?: string;
  /** Mobile: Owner Alert below proposals block; desktop: above heading (unchanged). */
  ownerAlertMobileBelowProposals?: boolean;
  /** Extra classes on the desktop Owner Alert (e.g. `hidden lg:block`). */
  ownerAlertClassName?: string;
  /** Rendered before the "Proposals" heading (e.g. mobile aerial view + Zestimate). */
  beforeProposalsHeading?: ReactNode;
  /** After context blocks, before the "Proposals" heading (e.g. mobile AI assistant). */
  afterContextBeforeProposals?: ReactNode;
  /** Hide the "Current Highest Proposal" banner when shown in a market snapshot above. */
  hideHighestProposalBanner?: boolean;
  /** Anchor id for the proposals heading (scroll targets). */
  proposalsHeadingId?: string;
};

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
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  catch {
    return iso;
  }
}

/** Offer table column: mm/dd/yy */
function formatProposalDateShort(iso: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (dateOnly) {
    const [, y, mo, d] = dateOnly;
    return `${mo}/${d}/${y.slice(-2)}`;
  }
  try {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return iso;
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = String(dt.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  } catch {
    return iso;
  }
}

/** Original desired days to close: calendar days between offer date and closing date (date-only, no countdown). */
function desiredDaysToClose(offerDateIso: string, closingDateIso: string): number {
  const offerDay = offerDateIso.slice(0, 10);
  const closingDay = closingDateIso.slice(0, 10);
  const t1 = new Date(offerDay).getTime();
  const t2 = new Date(closingDay).getTime();
  return Math.max(0, Math.round((t2 - t1) / (24 * 60 * 60 * 1000)));
}

function formatFinancing(type: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    conventional: "Conv",
    fha: "FHA",
    va: "VA",
    other: "Other",
  };
  return map[type.toLowerCase()] ?? type;
}

/** Clickable proposal row: visible hover on light backgrounds + keyboard focus. */
const PROPOSAL_ROW_INTERACTIVE_CLASS =
  "cursor-pointer transition-[background-color,box-shadow] hover:bg-[var(--border-subtle)] hover:shadow-[inset_3px_0_0_0_#2C56A3] focus-visible:outline-none focus-visible:bg-[var(--border-subtle)] focus-visible:shadow-[inset_3px_0_0_0_#2C56A3] focus-visible:ring-2 focus-visible:ring-[#2C56A3]/25 active:bg-[var(--border-subtle)]";

export function ProposalsPublicView({
  proposals,
  listPriceCents = 0,
  bestOfferCents = 0,
  offerDeadline,
  enableInquiry = false,
  inquiryAddressLabel,
  showOwnerAlertBanner = false,
  ownerInquiryPhone = "760-123-4560",
  ownerAlertMobileBelowProposals = false,
  ownerAlertClassName = "",
  beforeProposalsHeading,
  afterContextBeforeProposals,
  hideHighestProposalBanner = false,
  proposalsHeadingId = "property-proposals",
}: ProposalsPublicViewProps) {
  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");
  const [priceSort, setPriceSort] = useState<"none" | "high" | "low">("high");
  const [financingFilter, setFinancingFilter] = useState<
    "all" | "cash" | "conventional" | "fha" | "va" | "other"
  >("all");
  const [daysSort, setDaysSort] = useState<"none" | "high" | "low">("high");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [selectedProposal, setSelectedProposal] = useState<ProposalPublic | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryName, setInquiryName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [preferredContactMethod, setPreferredContactMethod] = useState<"email" | "text" | "phone">("email");
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);

  const now = new Date();

  useEffect(() => {
    if (!enableInquiry) return;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setIsLoggedIn(!!user);
        setUserEmail(user?.email ?? "");
        setInquiryEmail(user?.email ?? "");
      })
      .catch(() => {
        setIsLoggedIn(false);
        setUserEmail("");
        setInquiryEmail("");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? "";
      setIsLoggedIn(!!session?.user);
      setUserEmail(email);
      setInquiryEmail(email);
    });

    return () => {
      // Supabase returns a real subscription object; guard just in case shape changes.
      subscription?.unsubscribe?.();
    };
  }, [enableInquiry]);

  // Filter only by financing type; other controls are purely sort options.
  const filtered = proposals.filter((p) => {
    if (financingFilter !== "all" && p.financingType.toLowerCase() !== financingFilter) {
      return false;
    }
    return true;
  });

  const pendingProposals = [...filtered].sort((a, b) => {
    const aTime = new Date(a.offerDate).getTime();
    const bTime = new Date(b.offerDate).getTime();
    const aDays =
      a.desiredDaysToClose != null
        ? a.desiredDaysToClose
        : desiredDaysToClose(a.offerDate, a.closingDate);
    const bDays =
      b.desiredDaysToClose != null
        ? b.desiredDaysToClose
        : desiredDaysToClose(b.offerDate, b.closingDate);

    // Determine primary sort based on which control is active:
    // 1) Price (if explicitly set)
    if (priceSort !== "none" && a.priceCents !== b.priceCents) {
      return priceSort === "high" ? b.priceCents - a.priceCents : a.priceCents - b.priceCents;
    }

    // 2) Days to close (if explicitly set)
    if (daysSort !== "none" && aDays !== bDays) {
      return daysSort === "high" ? bDays - aDays : aDays - bDays;
    }

    // 3) Fallback to proposal date
    if (bTime !== aTime) {
      return dateSort === "newest" ? bTime - aTime : aTime - bTime;
    }

    // Stable fallback
    return 0;
  });

  const inquiryTargetLabel = inquiryAddressLabel ?? "this property";

  const getDaysToClose = (p: ProposalPublic) =>
    p.desiredDaysToClose != null ? p.desiredDaysToClose : desiredDaysToClose(p.offerDate, p.closingDate);

  const preferredContactLabel = useMemo(() => {
    const map: Record<"email" | "text" | "phone", string> = {
      email: "email",
      text: "text",
      phone: "phone",
    };
    return map;
  }, []);

  const openProposalSheet = (p: ProposalPublic) => {
    setSelectedProposal(p);
    setSheetOpen(true);
    setInquiryLoading(false);
    setInquiryError(null);
    setInquirySuccess(null);
    setInquiryPhone("");
    setInquiryEmail(isLoggedIn ? userEmail : "");
    setInquiryName("");
    setIsOwner(false);
    setPreferredContactMethod("email");
  };

  const handleDiscussSubmit = async () => {
    if (!selectedProposal) return;

    setInquiryLoading(true);
    setInquiryError(null);
    setInquirySuccess(null);

    try {
      const name = inquiryName.trim();
      const phone = inquiryPhone.trim();
      const email = inquiryEmail.trim();

      if (!name) {
        setInquiryLoading(false);
        setInquiryError("Please enter your name.");
        return;
      }

      if (!isOwner) {
        setInquiryLoading(false);
        setInquiryError("Please confirm you are the owner of the property.");
        return;
      }

      if (!email) {
        setInquiryLoading(false);
        setInquiryError("Please enter your email address.");
        return;
      }

      if ((preferredContactMethod === "phone" || preferredContactMethod === "text") && !phone) {
        setInquiryLoading(false);
        setInquiryError("Please enter your phone number.");
        return;
      }

      const res = await fetch("/api/proposals/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          proposalId: selectedProposal.id,
          inquiryAddressLabel: inquiryTargetLabel,
          name,
          email,
          phone: phone || undefined,
          preferredContactMethod,
            isOwner,
          message:
            "Interested in this offer? A HomePosal representative will help you verify the details and next steps.",
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setInquiryLoading(false);
        setInquiryError(
          typeof data?.error === "string" && data.error
            ? data.error
            : "Your request could not be sent. Please try again."
        );
        return;
      }

      const method = preferredContactLabel[preferredContactMethod];
      setInquirySuccess(
        `Your request has been sent. A HomePosal representative will reach out shortly via ${method}.`
      );
      setInquiryLoading(false);
    } catch (e) {
      console.error("Discuss proposal request failed:", e);
      setInquiryLoading(false);
      setInquiryError("Your request could not be sent. Please try again.");
    }
  };

  const hasDeadline = !!offerDeadline;
  const end = offerDeadline ? new Date(offerDeadline) : null;
  const diff = end ? end.getTime() - now.getTime() : 0;
  const timeLeft = hasDeadline
    ? diff <= 0
      ? "Ended"
      : diff > 24 * 60 * 60 * 1000
        ? `${Math.floor(diff / (24 * 60 * 60 * 1000))}d left`
        : `${Math.floor(diff / (60 * 60 * 1000))}h left`
    : null;

  const financeLabel: Record<typeof financingFilter, string> = {
    all: "All",
    cash: "Cash",
    conventional: "Conv",
    fha: "FHA",
    va: "VA",
    other: "Other",
  };

  useEffect(() => {
    if (!filtersOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    const onMouseDown = (e: MouseEvent) => {
      const el = popoverRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [filtersOpen]);

  const showOwnerAlert =
    showOwnerAlertBanner && enableInquiry && pendingProposals.length > 0;

  return (
    <div className="flex flex-col p-4">
      {showOwnerAlert && (
        <OwnerAlertBanner
          ownerInquiryPhone={ownerInquiryPhone}
          className={[
            "mb-4",
            ownerAlertMobileBelowProposals ? "hidden lg:block" : "",
            ownerAlertClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}

      {beforeProposalsHeading}

      {afterContextBeforeProposals}

      <div
        id={proposalsHeadingId}
        className="mb-4 flex scroll-mt-3 items-center justify-between gap-3"
      >
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Proposals
        </h2>

        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            className="inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs font-medium text-[var(--foreground)] shadow-sm hover:bg-[var(--border-subtle)]"
            title="Filter / Sort"
          >
            <span>Filter / Sort</span>
            <span aria-hidden="true" className="text-[0.65rem] text-[var(--foreground-muted)]">
              ▾
            </span>
          </button>

          {filtersOpen && (
            <div
              role="dialog"
              aria-label="Filter and sort proposals"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-[200] w-[280px] rounded-2xl border border-[var(--border)] bg-white/85 p-3 shadow-xl backdrop-blur-md"
            >
              <div className="space-y-3 text-xs text-[var(--foreground)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--foreground)]">Proposal Date</span>
                  <select
                    value={dateSort}
                    onChange={(e) => setDateSort(e.target.value as typeof dateSort)}
                    className="min-h-[32px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)]"
                  >
                    <option value="newest">Newest → Oldest</option>
                    <option value="oldest">Oldest → Newest</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--foreground)]">Price</span>
                  <select
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value as typeof priceSort)}
                    className="min-h-[32px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)]"
                  >
                    <option value="high">High → Low</option>
                    <option value="low">Low → High</option>
                    <option value="none">No price sort</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--foreground)]">Financing</span>
                  <select
                    value={financingFilter}
                    onChange={(e) => setFinancingFilter(e.target.value as typeof financingFilter)}
                    className="min-h-[32px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)]"
                    aria-label="Financing filter"
                  >
                    <option value="all">{financeLabel.all}</option>
                    <option value="cash">{financeLabel.cash}</option>
                    <option value="conventional">{financeLabel.conventional}</option>
                    <option value="fha">{financeLabel.fha}</option>
                    <option value="va">{financeLabel.va}</option>
                    <option value="other">{financeLabel.other}</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-[var(--foreground)]">Days to close</span>
                  <select
                    value={daysSort}
                    onChange={(e) => setDaysSort(e.target.value as typeof daysSort)}
                    className="min-h-[32px] rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--foreground)]"
                  >
                    <option value="high">High → Low</option>
                    <option value="low">Low → High</option>
                    <option value="none">No days sort</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDateSort("newest");
                      setPriceSort("high");
                      setFinancingFilter("all");
                      setDaysSort("high");
                    }}
                    className="rounded-md px-2 py-1 text-xs text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(bestOfferCents > 0 || timeLeft) && (
        <div
          className={[
            "mb-4 flex items-center justify-between rounded-md bg-[var(--background-elevated)] px-4 py-3",
            hideHighestProposalBanner ? "hidden md:flex" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Current Highest Proposal</p>
            <p className="font-tabular text-xl font-semibold text-[var(--success)]">
              {bestOfferCents > 0 ? formatCurrency(bestOfferCents) : "—"}
            </p>
          </div>
          {timeLeft && <div className="text-sm text-[var(--foreground-muted)]">{timeLeft}</div>}
        </div>
      )}

      {enableInquiry && (
        <p className="mb-3 text-xs text-[var(--foreground-muted)]">
          Tip: Click a proposal (or the info icon) to request more details.
        </p>
      )}

      <div className="max-h-64 overflow-y-auto">
        {pendingProposals.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">
            No proposals yet. Be the first.
          </p>
        ) : (
          <>
            {/* Mobile: stacked rows so price is never clipped */}
            <ul className="space-y-2 md:hidden" role="list">
              {pendingProposals.map((p) => {
                const days =
                  p.desiredDaysToClose != null
                    ? p.desiredDaysToClose
                    : desiredDaysToClose(p.offerDate, p.closingDate);
                return (
                  <li
                    key={p.id}
                    className={`kalshi-border-subtle rounded-lg border px-3 py-2.5 ${
                      enableInquiry ? PROPOSAL_ROW_INTERACTIVE_CLASS : ""
                    }`}
                    role={enableInquiry ? "button" : undefined}
                    tabIndex={enableInquiry ? 0 : undefined}
                    onClick={enableInquiry ? () => openProposalSheet(p) : undefined}
                    onKeyDown={
                      enableInquiry
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") openProposalSheet(p);
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[var(--foreground-muted)]">
                          Proposal Date
                        </p>
                        <p className="mt-0.5 text-sm text-[var(--foreground)]">
                          {formatProposalDateShort(p.offerDate)}
                        </p>
                      </div>
                      {enableInquiry && (
                        <button
                          type="button"
                          className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
                          aria-label="Discuss this proposal"
                          title="I'm the Owner: I Like To Discuss this Proposal"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProposalSheet(p);
                          }}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 break-words font-tabular text-base font-semibold leading-snug text-[var(--success)]">
                      {formatCurrency(p.priceCents)}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[var(--foreground-muted)]">Funding</p>
                        <p className="mt-0.5 text-sm capitalize text-[var(--foreground)]">
                          {formatFinancing(p.financingType)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[var(--foreground-muted)]">Days to close</p>
                        <p className="mt-0.5 text-sm text-[var(--foreground)]">{days}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* md+: compact table */}
            <table className="hidden w-full table-fixed text-sm md:table">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--foreground-muted)]">
                  <th className="w-[23%] py-2 pr-1 font-medium leading-tight">
                    Proposal Date
                  </th>
                  <th className="w-[30%] py-2 pr-2 font-medium">
                    Price
                  </th>
                  <th className="w-[20%] py-2 pr-1 font-medium">
                    Funding
                  </th>
                  <th className="w-[27%] py-2 font-medium">
                    Days to Close
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingProposals.map((p) => (
                  <tr
                    key={p.id}
                    className={`kalshi-border-subtle border-b last:border-0 ${
                      enableInquiry ? PROPOSAL_ROW_INTERACTIVE_CLASS : ""
                    }`}
                    role={enableInquiry ? "button" : undefined}
                    tabIndex={enableInquiry ? 0 : undefined}
                    onClick={enableInquiry ? () => openProposalSheet(p) : undefined}
                    onKeyDown={
                      enableInquiry
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") openProposalSheet(p);
                          }
                        : undefined
                    }
                  >
                    <td className="w-[23%] py-2 pr-1 text-[var(--foreground-muted)] whitespace-nowrap">
                      {formatProposalDateShort(p.offerDate)}
                    </td>
                    <td className="w-[30%] py-2 pr-2 font-tabular text-[var(--success)] whitespace-nowrap">
                      {formatCurrency(p.priceCents)}
                    </td>
                    <td className="w-[20%] py-2 pr-1 capitalize text-[var(--foreground-muted)] whitespace-nowrap">
                      {formatFinancing(p.financingType)}
                    </td>
                    <td className="w-[27%] py-2 text-[var(--foreground-muted)] whitespace-nowrap">
                      <div className="flex items-center justify-between gap-2">
                        <span>
                          {p.desiredDaysToClose != null
                            ? p.desiredDaysToClose
                            : desiredDaysToClose(p.offerDate, p.closingDate)}
                        </span>
                        {enableInquiry && (
                          <button
                            type="button"
                            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
                            aria-label="Discuss this proposal"
                            title="I'm the Owner: I Like To Discuss this Proposal"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProposalSheet(p);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {listPriceCents > 0 && (
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          List price:{" "}
          <span className="font-tabular text-[var(--foreground)]">
            {formatCurrency(listPriceCents)}
          </span>
        </p>
      )}

      {showOwnerAlert && ownerAlertMobileBelowProposals && (
        <OwnerAlertBanner
          ownerInquiryPhone={ownerInquiryPhone}
          className="mt-4 lg:hidden"
        />
      )}

      {enableInquiry && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent>
            <div className="px-4 py-6">
              <div className="mb-4 flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1 pr-1">
                  <h3 className="whitespace-normal break-words text-balance text-lg font-bold leading-snug text-[var(--foreground)] sm:text-xl">
                    I&apos;m the Owner: I&apos;d Like to Discuss this Proposal
                  </h3>
                  {selectedProposal ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--foreground-muted)]">
                      {inquiryTargetLabel} • {formatDate(selectedProposal.offerDate)} •{" "}
                      <span className="font-tabular text-[var(--success)]">
                        {formatCurrency(selectedProposal.priceCents)}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      Send an inquiry to verify details and next steps.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="shrink-0 min-h-[36px] min-w-[36px] rounded-full border border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
                  aria-label="Close inquiry drawer"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedProposal ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-4">
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {inquiryTargetLabel} • {formatDate(selectedProposal.offerDate)} •{" "}
                    <span className="font-tabular text-[var(--success)]">
                      {formatCurrency(selectedProposal.priceCents)}
                    </span>
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">Price</p>
                      <p className="mt-1 font-tabular text-base text-[var(--success)]">
                        {formatCurrency(selectedProposal.priceCents)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">Funding</p>
                      <p className="mt-1 capitalize text-sm text-[var(--foreground)]">
                        {formatFinancing(selectedProposal.financingType)}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-[var(--foreground-muted)]">Days to Close</p>
                      <p className="mt-1 text-sm text-[var(--foreground)]">
                        {getDaysToClose(selectedProposal)}
                      </p>
                    </div>
                  </div>
                </div>

                {inquirySuccess ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-sm">
                    <p className="text-sm font-medium text-[var(--foreground)]">Success</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{inquirySuccess}</p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleDiscussSubmit();
                    }}
                    className="space-y-4 px-1 pb-4"
                  >
                    <div>
                      <label
                        htmlFor="inquiry-name"
                        className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)]"
                      >
                        Name
                      </label>
                      <input
                        id="inquiry-name"
                        type="text"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        placeholder="Your full name"
                        className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                        autoComplete="name"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="inquiry-email"
                        className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)]"
                      >
                        <Mail className="h-4 w-4" />
                        Email Address
                      </label>
                      <input
                        id="inquiry-email"
                        type="email"
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="inquiry-phone"
                        className="flex items-center gap-2 text-sm font-medium text-[var(--foreground-muted)]"
                      >
                        <Phone className="h-4 w-4" />
                        Phone Number (optional)
                      </label>
                      <input
                        id="inquiry-phone"
                        type="tel"
                        inputMode="tel"
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                        autoComplete="tel"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="inquiry-method"
                        className="block text-sm font-medium text-[var(--foreground-muted)]"
                      >
                        Preferred Contact Method
                      </label>
                      <select
                        id="inquiry-method"
                        value={preferredContactMethod}
                        onChange={(e) =>
                          setPreferredContactMethod(e.target.value as "email" | "text" | "phone")
                        }
                        className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                      >
                        <option value="email">Email</option>
                        <option value="text">Text</option>
                        <option value="phone">Phone</option>
                      </select>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm">
                      <input
                        type="checkbox"
                        checked={isOwner}
                        onChange={(e) => setIsOwner(e.target.checked)}
                        className="mt-1 h-5 w-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/30"
                      />
                      <span className="text-[var(--foreground-muted)]">I confirm I am the owner of this property.</span>
                    </label>

                    {inquiryError && <p className="text-sm text-red-600">{inquiryError}</p>}

                    <button
                      type="submit"
                      disabled={inquiryLoading}
                      className="min-h-[44px] w-full rounded-md bg-[var(--success)] px-4 py-2.5 text-base font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {inquiryLoading ? "Submitting..." : "Discuss this Proposal"}
                    </button>

                  </form>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--foreground-muted)]">Select a proposal to view details.</p>
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
