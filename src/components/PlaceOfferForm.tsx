"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Paperclip, Send, Sparkles, X } from "lucide-react";
import type { ZillowZestimatePayload } from "@/types/zillow";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

function getMessageText(message: unknown): string {
  const m = message as {
    content?: unknown;
    text?: unknown;
    parts?: Array<{ type?: unknown; text?: unknown }> | unknown;
  };
  if (typeof m?.content === "string") return m.content;
  if (typeof m?.text === "string") return m.text;
  if (Array.isArray(m?.parts)) {
    return m.parts
      .map((p) => {
        if (!p) return "";
        if (p.type === "text" && typeof p.text === "string") return p.text;
        if (typeof p.text === "string") return p.text;
        return "";
      })
      .join("");
  }
  return "";
}

type PlaceOfferFormProps = {
  propertyId?: string;
  listPriceCents?: number;
  initialAmount?: string;
  isLoggedIn: boolean;
  redirectPath: string;
  // Place mode: for address-only selections
  placeAddress?: string;
  placeLat?: number;
  placeLng?: number;
  /** Optional Zillow lookup info for property mode (or overrides for place mode). */
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

export function PlaceOfferForm({
  propertyId,
  listPriceCents = 0,
  isLoggedIn,
  redirectPath,
  placeAddress,
  placeLat = 0,
  placeLng = 0,
  zillowLookupAddress,
  zillowLookupLat,
  zillowLookupLng,
}: PlaceOfferFormProps) {
  const isPlaceMode = !!(placeAddress && typeof placeLat === "number" && typeof placeLng === "number");
  const lookupAddressRaw = (zillowLookupAddress ?? (isPlaceMode ? placeAddress : null) ?? "").trim();
  const lookupLat = typeof zillowLookupLat === "number" ? zillowLookupLat : isPlaceMode ? placeLat : undefined;
  const lookupLng = typeof zillowLookupLng === "number" ? zillowLookupLng : isPlaceMode ? placeLng : undefined;

  const [open, setOpen] = useState(false);
  const [zestimateUsd, setZestimateUsd] = useState<number | null>(null);
  const [listing, setListing] = useState<{ isListed: boolean; maybeListed: boolean; homeStatus: string | null; zillowUrl: string | null }>({
    isListed: false,
    maybeListed: false,
    homeStatus: null,
    zillowUrl: null,
  });

  const listPriceUsd = listPriceCents > 0 ? listPriceCents / 100 : null;

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!lookupAddressRaw) return;
      try {
        const qs = new URLSearchParams();
        qs.set("address", lookupAddressRaw.replace(/,\s*(usa|united states)$/i, "").trim());
        if (typeof lookupLat === "number" && Number.isFinite(lookupLat)) qs.set("lat", String(lookupLat));
        if (typeof lookupLng === "number" && Number.isFinite(lookupLng)) qs.set("lng", String(lookupLng));

        const [zRes, sRes] = await Promise.all([
          fetch(`/api/zillow/zestimate?${qs.toString()}`, { cache: "no-store" }),
          fetch(`/api/zillow/listing-status?${new URLSearchParams({ address: qs.get("address") ?? "" }).toString()}`, { cache: "no-store" }),
        ]);

        const zJson = (await zRes.json().catch(() => null)) as
          | { ok: true; data: ZillowZestimatePayload }
          | { ok?: false; error?: string }
          | null;
        const sJson = (await sRes.json().catch(() => null)) as
          | { ok: true; data: { homeStatus: string; zillowUrl: string } }
          | { ok?: false; error?: string }
          | null;

        if (!cancelled) {
          setZestimateUsd(zRes.ok && zJson?.ok === true ? zJson.data.zestimateUsd ?? null : null);

          if (sRes.ok && sJson?.ok === true) {
            const cls = classifyHomeStatus(sJson.data.homeStatus);
            setListing({
              isListed: cls.isListed,
              maybeListed: cls.maybeListed,
              homeStatus: sJson.data.homeStatus,
              zillowUrl: sJson.data.zillowUrl,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setZestimateUsd(null);
          setListing({ isListed: false, maybeListed: false, homeStatus: null, zillowUrl: null });
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [lookupAddressRaw, lookupLat, lookupLng]);

  const chatBody = useMemo(
    () => ({
      context: {
        ...(propertyId ? { propertyId } : null),
        ...(isPlaceMode ? { placeAddress, placeLat, placeLng } : null),
        zestimateUsd,
        listPriceUsd,
      },
    }),
    [propertyId, isPlaceMode, placeAddress, placeLat, placeLng, zestimateUsd, listPriceUsd]
  );

  const { messages, setMessages, sendMessage, status, error, stop, regenerate } = useChat({
    transport: new TextStreamChatTransport({
      api: "/api/proposals/concierge",
    }),
  });

  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: "concierge-welcome",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Hi — I’m your Proposal Concierge. I’ll gather a few details step-by-step and verify everything before submitting. First question: what is your legal name?",
            },
          ],
        },
      ];
    });
  }, [open, setMessages]);

  const lastAssistantText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return getMessageText(messages[i]);
    }
    return "";
  }, [messages]);

  const quickReplies = useMemo(() => {
    const t = lastAssistantText.toLowerCase();
    if (!t) return [];
    if (t.includes("financing")) {
      return [
        { label: "Cash", value: "Financing: cash" },
        { label: "Loan", value: "Financing: loan" },
      ];
    }
    if (t.includes("contingenc")) {
      return [
        { label: "None", value: "Contingencies: none" },
        { label: "Inspection", value: "Contingencies: inspection" },
        { label: "Appraisal", value: "Contingencies: appraisal" },
      ];
    }
    if (t.includes("legal name")) {
      return [{ label: "Use my account name", value: "Legal name: " }];
    }
    if (t.includes("purchase price") || t.includes("price")) {
      return [{ label: "Example format", value: "Purchase price: 850000" }];
    }
    if (t.includes("deposit")) {
      return [{ label: "Example format", value: "Initial deposit: 50000" }];
    }
    if (t.includes("proof") && t.includes("upload")) {
      return [{ label: "I uploaded it", value: "Proof uploaded" }];
    }
    return [];
  }, [lastAssistantText]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, open]);

  const [proofUploading, setProofUploading] = useState(false);
  const [proof, setProof] = useState<{ bucket: string; path: string } | null>(null);

  const isLoading = status !== "ready";

  const requirementHints = useMemo(
    () => [
      "Legal name",
      "Purchase price",
      "Initial deposit",
      "Financing (cash/loan)",
      "Contingencies",
      `Proof of funds (${proof ? "uploaded" : "required"})`,
    ],
    [proof]
  );

  async function uploadProof(file: File) {
    setProofUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/proposals/proof-of-funds/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; bucket: string; path: string }
        | { ok?: false; error?: string }
        | null;
      if (!res.ok || !json || json.ok !== true) {
        const msg = json && "error" in json && typeof json.error === "string" ? json.error : "Upload failed.";
        throw new Error(msg);
      }
      const info = { bucket: String(json.bucket), path: String(json.path) };
      setProof(info);
      sendMessage(
        { text: `Proof of funds uploaded. bucket=${info.bucket} path=${info.path}` },
        { body: chatBody }
      );
    } finally {
      setProofUploading(false);
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--foreground)]">Make Proposal</h3>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Concierge chat · minimal, step-by-step verification
          </p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0 border-[var(--border)] bg-[var(--success)] text-white hover:bg-[var(--success)] hover:brightness-110"
          onClick={() => setOpen(true)}
          disabled={listing.isListed}
        >
          <Sparkles className="h-4 w-4" />
          {listing.isListed ? "Disabled" : "Start"}
        </Button>
      </div>

      {listing.isListed && (
        <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] p-3 text-sm text-[var(--foreground-muted)]">
          <p className="font-medium text-[var(--foreground)]">Listed on Zillow</p>
          {listing.homeStatus && (
            <p className="mt-1">
              Status: <span className="font-semibold text-[var(--foreground)]">{listing.homeStatus.replace(/_/g, " ")}</span>
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <SheetHeader>
              <SheetTitle>Proposal Concierge</SheetTitle>
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                We’ll collect details, validate them, then submit as <span className="font-medium">verified</span>.
              </p>
            </SheetHeader>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-b border-[var(--border)] px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.7rem] font-medium text-[var(--foreground)]">Required to submit</p>
                <p className="mt-1 text-[0.7rem] text-[var(--foreground-muted)]">
                  Answer one line at a time (examples provided), then upload proof of funds with the paperclip.
                </p>
              </div>
              <div className="shrink-0 text-[0.7rem] text-[var(--foreground-muted)]">
                {zestimateUsd != null ? `Zestimate $${Math.round(zestimateUsd).toLocaleString()}` : "Zestimate —"}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {requirementHints.map((h) => (
                <span
                  key={h}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-[0.7rem] text-[var(--foreground-muted)]"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1 px-5 py-4" viewportClassName="pr-2">
            <div className="space-y-3">
              {messages.map((m) => {
                const isUser = m.role === "user";
                const text = getMessageText(m);
                return (
                  <div key={m.id} className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl border px-3 py-2 text-sm leading-relaxed shadow-sm",
                        isUser
                          ? "border-[var(--border)] bg-[var(--background-elevated)] text-[var(--foreground)]"
                          : "border-[var(--border-subtle)] bg-[var(--background)] text-[var(--foreground)]",
                      ].join(" ")}
                    >
                      {text || (m.role === "assistant" ? "…" : "")}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-[var(--border)] px-5 py-4">
            {error && (
              <div className="mb-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {error instanceof Error ? error.message : String(error)}
              </div>
            )}

            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-[0.7rem] text-[var(--foreground-muted)]">
                {zestimateUsd != null ? `Zestimate: $${Math.round(zestimateUsd).toLocaleString()}` : "Zestimate: —"}
              </div>
              {proof ? (
                <div className="text-[0.7rem] text-[var(--foreground-muted)]">
                  Proof: <span className="font-medium text-[var(--foreground)]">uploaded</span>
                </div>
              ) : (
                <div className="text-[0.7rem] text-[var(--foreground-muted)]">Proof: not uploaded</div>
              )}
            </div>

            {quickReplies.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-[0.7rem] text-[var(--foreground-muted)]">Suggested:</span>
                {quickReplies.map((q) => (
                  <Button
                    key={q.label}
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => {
                      if (q.value === "Legal name: ") {
                        setDraft((v) => (v.trim() ? v : q.value));
                        return;
                      }
                      sendMessage({ text: q.value }, { body: chatBody });
                    }}
                    disabled={isLoading || proofUploading}
                    className="bg-[var(--background)]"
                  >
                    {q.label}
                  </Button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (proofUploading || isLoading) return;
                const text = draft.trim();
                if (!text) return;
                sendMessage({ text }, { body: chatBody });
                setDraft("");
              }}
              className="flex items-center gap-2"
            >
              <label className="shrink-0">
                <span className="sr-only">Upload proof of funds</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    e.currentTarget.value = "";
                    if (!f) return;
                    void uploadProof(f).catch((err) => {
                      const msg =
                        err instanceof Error
                          ? `I couldn’t upload that file: ${err.message}`
                          : "I couldn’t upload that file. Please try again.";
                      sendMessage({ text: msg }, { body: chatBody });
                    });
                  }}
                  disabled={proofUploading || isLoading}
                />
                <Button variant="secondary" size="icon" type="button" disabled={proofUploading || isLoading}>
                  <Paperclip className="h-4 w-4" />
                </Button>
              </label>

              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={proofUploading ? "Uploading proof of funds…" : "Type your answer…"}
                disabled={isLoading || proofUploading}
              />

              <Button type="submit" size="icon" disabled={isLoading || proofUploading || !draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-[0.7rem] text-[var(--foreground-muted)]">
                Private · Verified before submission
              </div>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <Button variant="ghost" size="sm" type="button" onClick={() => stop()}>
                    Stop
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" type="button" onClick={() => regenerate()}>
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
