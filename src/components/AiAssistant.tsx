"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { ChevronDown, ChevronUp, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";

// Southern California bounds (same as SearchAISection)
const SOCAL_BOUNDS = {
  north: 35.5,
  south: 32.5,
  east: -115.0,
  west: -120.5,
};

/** Words that follow the address in a question — stop treating the tail as address input. */
const ADDRESS_SUFFIX_WORD =
  /\s+(worth|value|valued|proposals?|proposal|offers?|offer|zestimate|listed|for\s+sale)\b/i;

/** ZIP then more text (e.g. "92084 worth") means the user is past the address. */
const ZIP_THEN_MORE_TEXT = /\d{5}(?:\s*,?\s*(?:USA))?\s+\S/i;

function extractAddressSpan(text: string): { start: number; query: string } | null {
  const raw = text;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const lower = raw.toLowerCase();
  const markers = [" on ", " at ", " for "];
  for (const m of markers) {
    const idx = lower.lastIndexOf(m);
    if (idx >= 0) {
      const start = idx + m.length;
      const query = raw.slice(start).trim();
      if (query) return { start, query };
    }
  }

  const numIdx = raw.search(/\d{1,6}\s+\S/);
  if (numIdx >= 0) {
    return { start: numIdx, query: raw.slice(numIdx).trim() };
  }

  return null;
}

type AddressAutocompleteContext =
  | { enabled: false }
  | { enabled: true; start: number; query: string; suffix: string };

function getAddressAutocompleteContext(
  draft: string,
  selectedPlace: { address: string } | null
): AddressAutocompleteContext {
  const span = extractAddressSpan(draft);
  if (!span) return { enabled: false };

  let query = span.query.trim();
  if (query.length < 3 || !/^\d/.test(query)) return { enabled: false };

  let suffix = "";
  const suffixMatch = query.match(ADDRESS_SUFFIX_WORD);
  if (suffixMatch && suffixMatch.index != null) {
    suffix = query.slice(suffixMatch.index).trim();
    query = query.slice(0, suffixMatch.index).trim();
  } else if (ZIP_THEN_MORE_TEXT.test(query)) {
    const zipTail = query.match(/(\d{5}(?:\s*,?\s*(?:USA))?)(\s+.+)$/i);
    if (zipTail && zipTail.index != null) {
      query = query.slice(0, zipTail.index + zipTail[1].length).trim();
      suffix = zipTail[2].trim();
    }
  }

  if (suffix) return { enabled: false };

  if (!query || query.length < 3) return { enabled: false };

  if (selectedPlace?.address) {
    const placeIdx = draft.indexOf(selectedPlace.address);
    if (placeIdx >= 0) {
      const after = draft.slice(placeIdx + selectedPlace.address.length).trim();
      if (after.length > 0) return { enabled: false };
    }
  }

  return { enabled: true, start: span.start, query, suffix: "" };
}

function linkify(
  text: string
): Array<{ type: "text"; value: string } | { type: "link"; href: string; label: string }> {
  const parts: Array<{ type: "text"; value: string } | { type: "link"; href: string; label: string }> = [];

  // Prefer markdown-style links: [Label](/place?...), [Label](/property/123)
  const md = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/property\/[^\s)]+|\/place\?[^\s)]+)\)/g;
  let lastIndex = 0;
  for (const match of text.matchAll(md)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, idx) });
    parts.push({ type: "link", href: match[2], label: match[1] });
    lastIndex = idx + match[0].length;
  }
  const remaining = text.slice(lastIndex);
  if (!remaining) return parts;

  // Then linkify any bare URLs/paths.
  const re = /(https?:\/\/[^\s]+|\/property\/[^\s]+|\/place\?[^\s]+)/g;
  let innerLast = 0;
  for (const match of remaining.matchAll(re)) {
    const idx = match.index ?? 0;
    if (idx > innerLast) parts.push({ type: "text", value: remaining.slice(innerLast, idx) });
    const raw = match[0];
    parts.push({ type: "link", href: raw, label: raw });
    innerLast = idx + raw.length;
  }
  if (innerLast < remaining.length) parts.push({ type: "text", value: remaining.slice(innerLast) });
  return parts;
}

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

export function AiAssistant() {
  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({ api: "/api/chat" }),
  });

  const [draft, setDraft] = useState("");
  const isLoading = status !== "ready";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { isLoaded: isMapsLoaded } = useGoogleMaps();
  const [predictions, setPredictions] = useState<Array<{ placeId: string; description: string }>>([]);
  const [predictionsOpen, setPredictionsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: "assistant-welcome",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "How can I help you?",
            },
          ],
        },
      ];
    });
  }, [setMessages]);

  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const messageRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const wasLoadingRef = useRef(false);

  // After the agent finishes a reply, align the top of that message with the chat viewport.
  useEffect(() => {
    if (collapsed) return;

    const responseJustFinished = wasLoadingRef.current && status === "ready";
    wasLoadingRef.current = status !== "ready";

    if (!responseJustFinished) return;

    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;

    const scrollLatestAssistantToTop = () => {
      const container = messagesScrollRef.current;
      const row = messageRowRefs.current[last.id];
      if (!container || !row) return false;
      const top =
        row.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop;
      container.scrollTop = Math.max(0, Math.round(top));
      return true;
    };

    let attempts = 0;
    const tryScroll = () => {
      if (scrollLatestAssistantToTop() || attempts >= 4) return;
      attempts += 1;
      requestAnimationFrame(tryScroll);
    };
    requestAnimationFrame(tryScroll);
  }, [messages, status, collapsed]);

  // Address autocomplete (Google Places) on the assistant input.
  useEffect(() => {
    if (!isMapsLoaded) return;
    if (!window.google?.maps?.places) return;
    return () => {};
  }, [isMapsLoaded]);

  useEffect(() => {
    if (!isMapsLoaded) return;
    if (!window.google?.maps?.places) return;

    const ctx = getAddressAutocompleteContext(draft, selectedPlace);
    if (!ctx.enabled) {
      setPredictions([]);
      setPredictionsOpen(false);
      setActiveIdx(-1);
      return;
    }

    const q = ctx.query;

    const isNumericOnly = /^\d+$/.test(q);
    const requestInput = isNumericOnly ? `${q} ` : q;

    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
      new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
    );

    const socalCenter = new google.maps.LatLng(34.05, -118.25);

    const svc = new google.maps.places.AutocompleteService();
    const t = setTimeout(() => {
      svc.getPlacePredictions(
        {
          input: requestInput,
          // Use SoCal as a bias (not a hard restrict) so short numeric prefixes like "2365" still return results.
          bounds,
          // Extra bias that helps numeric-only inputs.
          location: socalCenter,
          radius: 400_000,
          componentRestrictions: { country: "us" },
          // For numeric-only prefixes, "address" often returns nothing; "geocode" is more permissive.
          types: [isNumericOnly ? "geocode" : "address"],
        },
        (results) => {
          const items =
            results?.map((r) => ({ placeId: r.place_id, description: r.description })) ?? [];
          setPredictions(items);
          setPredictionsOpen(items.length > 0);
          setActiveIdx(items.length > 0 ? 0 : -1);
        }
      );
    }, 120);

    return () => clearTimeout(t);
  }, [draft, isMapsLoaded, selectedPlace]);

  function closePredictionsSoon() {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => {
      setPredictionsOpen(false);
    }, 150);
  }

  function keepPredictionsOpen() {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  }

  async function selectPrediction(p: { placeId: string; description: string }) {
    // Resolve to formatted_address + geometry so server lookup matches Supabase records.
    let resolved = { address: p.description, lat: NaN, lng: NaN };
    try {
      if (window.google?.maps?.places) {
        const svc = new google.maps.places.PlacesService(document.createElement("div"));
        const details = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
          svc.getDetails(
            { placeId: p.placeId, fields: ["formatted_address", "geometry", "name"] },
            (placeDetails, status) => {
              if (status !== google.maps.places.PlacesServiceStatus.OK || !placeDetails) {
                resolve(null);
                return;
              }
              resolve(placeDetails);
            }
          );
        });
        const addr = (details?.formatted_address || details?.name || p.description).trim();
        const loc = details?.geometry?.location;
        const lat = loc ? loc.lat() : NaN;
        const lng = loc ? loc.lng() : NaN;
        resolved = { address: addr, lat, lng };
      }
    } catch {
      // ignore; fall back to description only
    }

    const span = extractAddressSpan(draft);
    const start = span?.start ?? 0;
    let suffix = "";
    if (span) {
      const suffixMatch = span.query.match(ADDRESS_SUFFIX_WORD);
      if (suffixMatch && suffixMatch.index != null) {
        suffix = span.query.slice(suffixMatch.index).trim();
      } else {
        const zipTail = span.query.match(/(\d{5}(?:\s*,?\s*(?:USA))?)(\s+.+)$/i);
        if (zipTail?.[2]) suffix = zipTail[2].trim();
      }
    }
    const nextText = `${draft.slice(0, start)}${resolved.address}${suffix ? ` ${suffix}` : ""}`;
    setDraft(nextText);
    if (Number.isFinite(resolved.lat) && Number.isFinite(resolved.lng)) {
      setSelectedPlace({ address: resolved.address, lat: resolved.lat, lng: resolved.lng });
    } else {
      setSelectedPlace(null);
    }
    setPredictionsOpen(false);
    setPredictions([]);
    setActiveIdx(-1);
    inputRef.current?.focus();
  }

  const displayMessages = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        text: getMessageText(m),
      })),
    [messages]
  );

  return (
    <div
      className={[
        "flex flex-col rounded-xl border border-[var(--border)] bg-white",
        collapsed ? "p-3" : "p-4",
      ].join(" ")}
    >
      <div className={collapsed ? "" : "mb-3"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
              Questions? Chat With a Specialist Now
              <Sparkles className="h-4 w-4 text-amber-400/90" aria-hidden />
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 bg-[var(--background)]"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand assistant" : "Collapse assistant"}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {collapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div
            ref={messagesScrollRef}
            className="overflow-y-auto overflow-anchor-none rounded-lg bg-zinc-100 p-2 pr-1 max-h-[min(280px,42vh)] lg:max-h-[200px] lg:p-3"
          >
            <div className="space-y-2">
              {displayMessages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={m.id}
                    ref={(el) => {
                      messageRowRefs.current[m.id] = el;
                    }}
                    className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}
                  >
                    <div
                      className={[
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                        isUser ? "bg-black text-white" : "bg-white text-black border border-black/5",
                      ].join(" ")}
                    >
                      {m.text ? (
                        <span>
                          {linkify(m.text).map((p, i) =>
                            p.type === "link" ? (
                              <a
                                key={`${p.href}-${i}`}
                                href={p.href}
                                className={[
                                  "underline underline-offset-2",
                                  isUser ? "text-white" : "text-black",
                                ].join(" ")}
                                target={p.href.startsWith("http") ? "_blank" : undefined}
                                rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              >
                                {p.label}
                              </a>
                            ) : (
                              <span key={i}>{p.value}</span>
                            )
                          )}
                        </span>
                      ) : m.role === "assistant" ? (
                        "…"
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {!collapsed && error && (
        <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {!collapsed && (
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (isLoading) return;
            const acCtx = getAddressAutocompleteContext(draft, selectedPlace);
            if (acCtx.enabled && predictionsOpen && activeIdx >= 0 && predictions[activeIdx]) {
              void selectPrediction(predictions[activeIdx]);
              return;
            }
            const text = draft.trim();
            if (!text) return;
            const place = selectedPlace && text.includes(selectedPlace.address) ? selectedPlace : null;
            sendMessage({ text }, place ? { body: { place } } : undefined);
            setDraft("");
            setSelectedPlace(null);
          }}
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => {
                keepPredictionsOpen();
                if (predictions.length > 0) setPredictionsOpen(true);
              }}
              onBlur={() => closePredictionsSoon()}
              onKeyDown={(e) => {
                const acCtx = getAddressAutocompleteContext(draft, selectedPlace);
                if (!predictionsOpen || !acCtx.enabled) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(predictions.length - 1, Math.max(0, i + 1)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(0, i - 1));
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setPredictionsOpen(false);
                } else if (e.key === "Enter" && activeIdx >= 0 && predictions[activeIdx]) {
                  e.preventDefault();
                  void selectPrediction(predictions[activeIdx]);
                }
              }}
              placeholder={isLoading ? "Thinking…" : "Ask a question"}
              disabled={isLoading}
              autoComplete="off"
              name="homeposal-ai-address"
              className="bg-white"
            />

            {predictionsOpen && predictions.length > 0 && (
              <div
                className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 z-[9999] max-h-56 overflow-auto rounded-xl border border-[var(--border)] bg-white shadow-xl"
                onMouseDown={() => keepPredictionsOpen()}
              >
                {predictions.map((p, idx) => (
                  <button
                    key={p.placeId}
                    type="button"
                    className={[
                      "block w-full px-3 py-2 text-left text-sm",
                      idx === activeIdx ? "bg-zinc-100" : "bg-white hover:bg-zinc-50",
                    ].join(" ")}
                    onClick={() => void selectPrediction(p)}
                  >
                    {p.description}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" size="icon" disabled={isLoading || !draft.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}

