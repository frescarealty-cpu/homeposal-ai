import { NextRequest, NextResponse } from "next/server";
import { convertToModelMessages, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { MOCK_PROPERTIES } from "@/data/properties";
import { getMockProposalsPublic } from "@/data/mockProposals";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function textStreamResponse(text: string, status = 200) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

type IncomingMessage = {
  role?: string;
  content?: unknown;
  text?: unknown;
  parts?: Array<{ type?: unknown; text?: unknown }> | unknown;
};

function messageText(m: IncomingMessage): string {
  if (typeof m.content === "string") return m.content;
  if (typeof m.text === "string") return m.text;
  if (Array.isArray(m.parts)) {
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

function lastUserText(messages: IncomingMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === "user") return messageText(m);
  }
  return "";
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function looksLikeAddress(q: string) {
  const t = q.trim();
  if (t.length < 6) return false;
  // crude but effective: street number + at least one letter.
  return /\d{1,6}/.test(t) && /[a-zA-Z]/.test(t);
}

function extractAddressCandidate(text: string) {
  const raw = text.trim();
  if (!raw) return "";

  // If user asked a question, try to pull the address portion.
  // Examples:
  // - "are there any proposals on 2365 Buena Creek Trail, Vista, CA 92084, USA"
  // - "proposals for 123 Oak Street, Los Angeles, CA 90012"
  const lower = raw.toLowerCase();
  const markers = [" on ", " for ", " at "];
  for (const m of markers) {
    const idx = lower.lastIndexOf(m);
    if (idx >= 0) {
      const candidate = raw.slice(idx + m.length).trim();
      if (candidate) return candidate.replace(/[?.!]+$/g, "").trim();
    }
  }

  // If it contains a comma and a street number, try from the first number onward.
  const numIdx = raw.search(/\d{1,6}\s+\S/);
  if (numIdx >= 0) {
    const candidate = raw.slice(numIdx).trim();
    if (candidate) return candidate.replace(/[?.!]+$/g, "").trim();
  }

  return raw.replace(/[?.!]+$/g, "").trim();
}

/** Match DB regardless of "USA" suffix (e.g. map vs autocomplete). */
function addressVariants(address: string): string[] {
  const trimmed = address.trim();
  if (!trimmed) return [];
  const variants = [trimmed];
  const withoutUSA = trimmed.replace(/,?\s*USA\s*$/i, "").trim();
  if (withoutUSA && withoutUSA !== trimmed) variants.push(withoutUSA);
  const withUSA = /,\s*USA\s*$/i.test(trimmed) ? trimmed : `${trimmed}, USA`;
  if (withUSA !== trimmed && !variants.includes(withUSA)) variants.push(withUSA);
  return variants;
}

function proposalsSummaryByPropertyId(propertyId: string) {
  const proposals = getMockProposalsPublic(propertyId);
  if (proposals.length === 0) return { count: 0, best: null as number | null, range: null as string | null };
  const best = Math.max(...proposals.map((p) => p.priceCents));
  const min = Math.min(...proposals.map((p) => p.priceCents));
  const max = Math.max(...proposals.map((p) => p.priceCents));
  const range = min === max ? formatCurrency(min) : `${formatCurrency(min)}–${formatCurrency(max)}`;
  return { count: proposals.length, best, range };
}

function looksLikeZestimateQuestion(text: string) {
  const t = text.toLowerCase();
  return t.includes("zestimate") || (t.includes("zillow") && (t.includes("estimate") || t.includes("value")));
}

export async function POST(req: NextRequest) {
  let body: { messages?: unknown[]; place?: { address?: unknown; lat?: unknown; lng?: unknown } };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return textStreamResponse("Invalid request.", 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastUser = lastUserText(messages as IncomingMessage[]).trim();
  const addressCandidate = extractAddressCandidate(lastUser);

  const place =
    body.place &&
    typeof body.place === "object" &&
    typeof body.place.address === "string" &&
    typeof body.place.lat === "number" &&
    typeof body.place.lng === "number" &&
    Number.isFinite(body.place.lat) &&
    Number.isFinite(body.place.lng)
      ? { address: body.place.address.trim(), lat: body.place.lat, lng: body.place.lng }
      : null;

  // Zestimate lookup (deterministic, no model).
  if (looksLikeZestimateQuestion(lastUser)) {
    const address = (place?.address || addressCandidate).trim();
    const lat = place?.lat;
    const lng = place?.lng;

    if (!address) {
      return textStreamResponse("What address should I look up?", 200);
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return textStreamResponse(
        `To fetch a Zestimate, please pick the address from the dropdown so I have lat/lng.`,
        200
      );
    }

    try {
      const url = new URL("/api/zillow/zestimate", req.url);
      url.searchParams.set("address", address.replace(/,?\s*USA\s*$/i, "").trim());
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lng", String(lng));

      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | { ok: true; data: { zestimateUsd?: number | null } }
        | { ok?: false; error?: string }
        | null;

      if (!res.ok || json == null) {
        const msg =
          json && typeof json === "object" && "error" in json && typeof json.error === "string"
            ? json.error
            : "Zestimate lookup failed.";
        return textStreamResponse(`I couldn’t fetch a Zestimate for that address. ${msg}`, 200);
      }

      if (json.ok !== true) {
        const msg =
          typeof json.error === "string" && json.error ? json.error : "Zestimate lookup failed.";
        return textStreamResponse(`I couldn’t fetch a Zestimate for that address. ${msg}`, 200);
      }

      const z = json.data?.zestimateUsd ?? null;
      if (z == null) {
        return textStreamResponse(`No Zestimate available for:\n${address}`, 200);
      }

      return textStreamResponse(
        `${address}\nZestimate: $${Math.round(z).toLocaleString()}`,
        200
      );
    } catch {
      return textStreamResponse("I couldn’t fetch a Zestimate right now.", 200);
    }
  }

  // Address → proposal lookup (deterministic, no model required).
  // This makes the assistant immediately useful as a "proposal finder".
  if (place || looksLikeAddress(addressCandidate)) {
    // 1) Exact match against known property pages (non-fuzzy).
    const normalized = (place?.address ?? addressCandidate).replace(/,?\s*USA\s*$/i, "").trim().toLowerCase();
    const exactProperty =
      MOCK_PROPERTIES.find((p) => {
        const full = `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`.toLowerCase();
        return full === normalized || p.address.toLowerCase() === normalized;
      }) ?? null;

    if (exactProperty) {
      const sum = proposalsSummaryByPropertyId(exactProperty.id);
      const header = `${exactProperty.address}, ${exactProperty.city}, ${exactProperty.state} ${exactProperty.zipCode}`;
      const countLine =
        sum.count === 0
          ? "Current proposals: none yet."
          : `Current proposals: ${sum.count} (range ${sum.range}).`;
      const link = `/property/${exactProperty.id}`;
      return textStreamResponse(`${header}\n${countLine}\n\n[Click here to see or make proposal(s)](${link})`, 200);
    }

    // 2) Real "place" proposals lookup from Supabase by address (no guessing).
    try {
      const supabase = await createClient();
      const addressForLookup = place?.address || addressCandidate;
      const variants = addressVariants(addressForLookup);

      type Row = {
        place_lat: number | null;
        place_lng: number | null;
        offer_amount_cents: number | null;
        status: string | null;
      };

      let rows: Row[] = [];
      let usedAddress: string | null = null;

      for (const addr of variants) {
        const res = await supabase
          .from("place_proposals")
          .select("place_lat, place_lng, offer_amount_cents, status")
          .eq("place_address", addr)
          .eq("status", "verified")
          .limit(200);

        if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
          rows = res.data as Row[];
          usedAddress = addr;
          break;
        }
      }

      // If direct "verified" rows are missing (due to formatting/status differences),
      // fall back to the same RPC the /place page uses.
      let lat: number | null =
        rows.find((r) => typeof r.place_lat === "number" && Number.isFinite(r.place_lat))?.place_lat ?? null;
      let lng: number | null =
        rows.find((r) => typeof r.place_lng === "number" && Number.isFinite(r.place_lng))?.place_lng ?? null;

      if (place) {
        lat = place.lat;
        lng = place.lng;
        usedAddress = usedAddress ?? place.address;
      }

      if (lat == null || lng == null) {
        for (const addr of variants) {
          const anyRes = await supabase
            .from("place_proposals")
            .select("place_lat, place_lng")
            .eq("place_address", addr)
            .limit(1)
            .maybeSingle();
          if (!anyRes.error && anyRes.data) {
            const aLat = anyRes.data.place_lat;
            const aLng = anyRes.data.place_lng;
            if (typeof aLat === "number" && Number.isFinite(aLat) && typeof aLng === "number" && Number.isFinite(aLng)) {
              lat = aLat;
              lng = aLng;
              usedAddress = usedAddress ?? addr;
              break;
            }
          }
        }
      }

      const addressLabel = usedAddress ?? addressCandidate;

      if (lat != null && lng != null) {
        for (const addr of addressVariants(addressLabel)) {
          const rpcRes = await supabase.rpc("get_place_proposals_public", {
            p_address: addr,
            p_lat: lat,
            p_lng: lng,
          });

          if (!rpcRes.error && Array.isArray(rpcRes.data)) {
            const prices = (rpcRes.data as Array<{ price_cents: number }>).map((r) => r.price_cents).filter((n) => n > 0);
            const verifiedCount = prices.length;
            if (verifiedCount > 0) {
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const range = min === max ? formatCurrency(min) : `${formatCurrency(min)}–${formatCurrency(max)}`;
              const link = `/place?address=${encodeURIComponent(addressLabel)}&lat=${lat}&lng=${lng}`;
              return textStreamResponse(
                `${addressLabel}\nVerified proposals: ${verifiedCount} (range ${range}).\n\n[Click here to see or make proposal(s)](${link})`,
                200
              );
            }
          }
        }
      }

      if (rows.length === 0) {
        return textStreamResponse(
          `No verified proposals found for:\n${addressCandidate}\n\nTip: open the address from the map search first, then paste the exact address shown on the place page.`,
          200
        );
      }

      // Fallback: use direct rows (verified only).
      const prices = rows.map((r) => r.offer_amount_cents ?? 0).filter((n) => n > 0);
      const verifiedCount = prices.length;
      const min = verifiedCount ? Math.min(...prices) : 0;
      const max = verifiedCount ? Math.max(...prices) : 0;
      const range = verifiedCount ? (min === max ? formatCurrency(min) : `${formatCurrency(min)}–${formatCurrency(max)}`) : "—";
      const link =
        lat != null && lng != null
          ? `/place?address=${encodeURIComponent(addressLabel)}&lat=${lat}&lng=${lng}`
          : null;
      return textStreamResponse(
        `${addressLabel}\nVerified proposals: ${verifiedCount} (range ${range}).\n\n${
          link
            ? `[Click here to see or make proposal(s)](${link})`
            : "Open this address from the map search to get a direct proposals link."
        }`,
        200
      );
    } catch {
      return textStreamResponse(
        `I couldn’t check proposals for that address right now (database not available).`,
        200
      );
    }
  }

  const modelMessages = await convertToModelMessages(
    messages as unknown as Parameters<typeof convertToModelMessages>[0]
  );

  const system = [
    "You are the HomePosal Concierge for FRESCA REALTY INC.",
    "You are professional, direct, and minimalist.",
    "",
    "Answering rules (important):",
    "- If the user’s question is specifically about HomePosal (the product, how proposals work here, verification, owners/suitors, listings, the platform’s process), you MUST use ONLY the CANONICAL PRODUCT DESCRIPTION below. If it’s not covered, say you don’t have that info and ask one short clarifying question. Do NOT guess.",
    "- If the user’s question is NOT about HomePosal specifically, you MAY answer using general knowledge if you are confident. Clearly label it as “General info” and do not present it as HomePosal policy or a verified fact. If unsure, say you’re not sure.",
    "- Never guess numbers, company policies, fees, timelines, or legal outcomes.",
    "",
    "CANONICAL PRODUCT DESCRIPTION (use this wording/meaning):",
    "What is HomePosal?",
    "HomePosal: We are a bulletin board that hosts purchase proposals for Southern California owners who want to see the market's interest without the pressure of a listing. We simply facilitate the connection between owners and the Interested Party.",
    "",
    "For Owners:",
    "- No Account Needed: View active proposals on your property instantly without signing up.",
    "- Verified Interest: See real, unsolicited proposals from independent parties even if you aren't listed for sale.",
    "- You're in Control: We won't contact you. If a proposal interests you, reach out to us for a formal presentation.",
    "",
    "For Suitors:",
    "- Submit Anywhere: Make a proposal on any Southern California property.",
    "- Serious Proposals Only: We only contact you to verify proof of funds, ensuring all interest is bona fide.",
    "- Direct Connections: If an owner is interested, we'll reach out to facilitate the deal.",
    "- Respecting Listings: If a property is already listed, we provide the agent's details to respect existing agreements.",
    "",
    "Response style rules:",
    "- Keep answers short (2–6 sentences).",
    "- Ask at most one follow-up question when needed.",
    "- Do not claim legal advice; suggest consulting a licensed professional when appropriate.",
  ].join("\n");

  // Prefer explicit env override. Otherwise try requested model first, then fall back.
  const requested = (process.env.GOOGLE_ASSISTANT_MODEL || "").trim() || "gemini-1.5-flash";
  const fallbackModels = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.5-flash"];

  async function tryModel(name: string) {
    return await generateText({
      model: google(name),
      system,
      messages: modelMessages,
    });
  }

  try {
    let result = await tryModel(requested);
    if (!result.text?.trim()) {
      // Extremely defensive: ensure we return some text.
      result = { ...result, text: "—" };
    }

    return textStreamResponse(result.text || "—", 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const looksLikeMissingModel =
      typeof msg === "string" &&
      (msg.includes("is not found for API version") || msg.includes("NOT_FOUND") || msg.includes("models/"));

    if (looksLikeMissingModel) {
      for (const candidate of fallbackModels) {
        try {
          const result = await tryModel(candidate);
          return textStreamResponse(result.text || "—", 200);
        } catch {
          // continue to next fallback
        }
      }
    }

    return textStreamResponse(`Chat failed. ${msg}`, 500);
  }
}

