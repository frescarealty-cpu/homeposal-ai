import type { NextRequest } from "next/server";
import type { ZillowZestimatePayload } from "@/types/zillow";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function looksLikePropertyValueQuestion(text: string, hasAddress = false) {
  const t = text.toLowerCase();
  if (/\bzestimate\b/.test(t)) return true;
  if (/\bzillow\b/.test(t) && /\b(estimate|value|worth)\b/.test(t)) return true;
  if (/\b(home|house|property)\s+value\b/.test(t)) return true;
  if (/\bmarket\s+value\b/.test(t)) return true;
  if (/\bestimated\s+value\b/.test(t)) return true;
  if (/\bhow\s+much\s+(is|are|was|were)\b/.test(t) && (hasAddress || /\b(worth|value|house|home|property)\b/.test(t)))
    return true;
  if (/\bwhat\s+is\b/.test(t) && /\b(worth|valued?\s+at)\b/.test(t)) return true;
  if (/\bwhat('s|s)\s+the\s+(value|worth)\b/.test(t)) return true;
  if (/\b(worth|value)\s+of\b/.test(t) && hasAddress) return true;
  return false;
}

export function formatZestimateBlock(data: ZillowZestimatePayload): string {
  const lines: string[] = [];

  if (data.zestimateUsd != null) {
    lines.push(`Zestimate (estimated market value): ${formatUsd(data.zestimateUsd)}`);
  }
  if (data.zestimateRangeLowUsd != null && data.zestimateRangeHighUsd != null) {
    lines.push(
      `Zestimate range: ${formatUsd(data.zestimateRangeLowUsd)} – ${formatUsd(data.zestimateRangeHighUsd)}`
    );
  }
  if (data.rentZestimateUsd != null) {
    lines.push(`Rent Zestimate: ${formatUsd(data.rentZestimateUsd)}/month`);
  }

  if (lines.length === 0) {
    lines.push("No Zestimate figures are available for this address from our data provider.");
  }

  if (data.lastUpdated) {
    lines.push(`Last updated: ${data.lastUpdated}`);
  }

  return lines.join("\n");
}

export function formatZestimateAssistantReply(address: string, data: ZillowZestimatePayload): string {
  return [
    `Thanks for asking about ${address}.`,
    "",
    formatZestimateBlock(data),
    "",
    "Zestimates are automated estimates from Zillow, not an appraisal. Pick the address from the dropdown when possible for the best match.",
  ].join("\n");
}

/** Prepend Zestimate block to an existing address reply (e.g. proposal summary). */
export function mergeAddressReplyWithZestimate(
  addressLine: string,
  proposalText: string,
  zestimate: ZillowZestimatePayload | null,
  zestimateNote?: string
): string {
  const parts: string[] = [`Thanks for asking about ${addressLine}.`, ""];

  if (zestimate) {
    parts.push(formatZestimateBlock(zestimate));
    parts.push("");
  } else if (zestimateNote) {
    parts.push(zestimateNote);
    parts.push("");
  }

  const body = proposalText.replace(/^Thanks for asking about[^\n]*\.\n\n?/i, "").trim();
  parts.push(body);
  return parts.join("\n");
}

export async function fetchZestimatePayload(
  req: NextRequest,
  address: string,
  lat?: number,
  lng?: number
): Promise<
  | { ok: true; data: ZillowZestimatePayload }
  | { ok: false; error: string; needsCoordinates?: boolean }
> {
  const normalized = address.replace(/,?\s*USA\s*$/i, "").trim();
  if (!normalized) {
    return { ok: false, error: "What address should I look up?" };
  }

  const url = new URL("/api/zillow/zestimate", req.url);
  url.searchParams.set("address", normalized);
  if (typeof lat === "number" && Number.isFinite(lat)) url.searchParams.set("lat", String(lat));
  if (typeof lng === "number" && Number.isFinite(lng)) url.searchParams.set("lng", String(lng));

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as
      | { ok: true; data: ZillowZestimatePayload }
      | { ok?: false; error?: string }
      | null;

    if (!res.ok || json == null) {
      const msg =
        json && typeof json === "object" && "error" in json && typeof json.error === "string"
          ? json.error
          : "Zestimate lookup failed.";
      if (msg.includes("not configured")) {
        return { ok: false, error: msg };
      }
      return { ok: false, error: msg, needsCoordinates: !lat && !lng };
    }

    if (json.ok !== true) {
      const msg =
        typeof json.error === "string" && json.error ? json.error : "Zestimate lookup failed.";
      return { ok: false, error: msg, needsCoordinates: !lat && !lng };
    }

    return { ok: true, data: json.data };
  } catch {
    return { ok: false, error: "I couldn't reach the Zestimate service right now." };
  }
}
