"use client";

import { Clock } from "lucide-react";

export type OfferRow = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
};

type OrderBookProps = {
  propertyId: string;
  listPriceCents: number;
  bestOfferCents: number;
  offers: OfferRow[];
  status: string;
  offerDeadline: string;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatTimeRemaining(deadline: string) {
  const end = new Date(deadline);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "Ended";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m left`;
  return "< 1m left";
}

export function OrderBook({
  listPriceCents,
  bestOfferCents,
  offers,
  status,
  offerDeadline,
}: OrderBookProps) {
  const pendingOffers = offers.filter((o) => o.status === "pending").sort((a, b) => b.amountCents - a.amountCents);

  return (
    <div className="flex flex-col p-4">
      <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Order Book</h2>

      <div className="mb-4 flex items-center justify-between rounded-md bg-[var(--background-elevated)] px-4 py-3">
        <div>
          <p className="text-xs text-[var(--foreground-muted)]">Current Best Proposal</p>
          <p className="font-tabular text-xl font-semibold text-[var(--success)]">
            {bestOfferCents > 0 ? formatCurrency(bestOfferCents) : "—"}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm text-[var(--foreground-muted)]">
          <Clock className="h-4 w-4" />
          {formatTimeRemaining(offerDeadline)}
        </div>
      </div>

      <div className="mb-2 flex justify-between text-xs text-[var(--foreground-muted)]">
        <span>Offer</span>
        <span>{pendingOffers.length} pending</span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--foreground-muted)]">
              <th className="py-2 font-medium">Amount</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {pendingOffers.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-8 text-center text-[var(--foreground-muted)]">
                  No offers yet. Be the first.
                </td>
              </tr>
            ) : (
              pendingOffers.map((offer) => (
                <tr
                  key={offer.id}
                  className="kalshi-border-subtle border-b last:border-0"
                >
                  <td className="font-tabular py-2 text-[var(--success)]">
                    {formatCurrency(offer.amountCents)}
                  </td>
                  <td className="py-2 text-[var(--foreground-muted)] capitalize">{offer.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-[var(--foreground-muted)]">
        List price: <span className="font-tabular text-[var(--foreground)]">{formatCurrency(listPriceCents)}</span>
      </p>
    </div>
  );
}
