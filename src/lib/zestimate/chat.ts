import type { NextRequest } from "next/server";
import type { ZillowZestimatePayload } from "@/types/zillow";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function looksLikePropertyValueQuestion(text: string) {
  const t = text.toLowerCase();
  if (/\bzestimate\b/.test(t)) return true;
  if (/\bzillow\b/.test(t) && /\b(estimate|value|worth)\b/.test(t)) return true;
  if (/\b(home|house|property)\s+value\b/.test(t)) return true;
  if (/\bmarket\s+value\b/.test(t)) return true;
  if (/\bestimated\s+value\b/.test(t)) return true;
  if (/\bhow\s+much\s+is\b/.test(t) && /\b(worth|value|house|home|property)\b/.test(t)) return true;
  if (/\bwhat\s+is\b/.test(t) && /\b(worth|valued?\s+at)\b/.test(t)) return true;
  if (/\bwhat('s|s)\s+the\s+(value|worth)\b/.test(t)) return true;
  return false;
}

export function formatZestimateAssistantReply(address: string, data: ZillowZestimatePayload): string {
  const lines: string[] = [`Thanks for asking about ${address}.`, ""];

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

  if (
    data.zestimateUsd == null &&
    data.rentZestimateUsd == null &&
    data.zestimateRangeLowUsd == null &&
    data.zestimateRangeHighUsd == null
  ) {
    lines.push("No Zestimate figures are available for this address from our data provider.");
  }

  if (data.lastUpdated) {
    lines.push("", `Last updated: ${data.lastUpdated}`);
  }

  lines.push(
    "",
    "Zestimates are automated estimates from Zillow, not an appraisal. Pick the address from the dropdown when possible for the best match."
  );
  return lines.join("\n");
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
