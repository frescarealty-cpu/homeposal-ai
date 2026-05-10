import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Browser-like headers reduce 403s when fetching Zillow from serverless (e.g. Vercel).
const BASE_HEADERS: Record<string, string> = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

function normalizeAddress(address: string) {
  return address.trim().replace(/,\s*(usa|united states)$/i, "").trim();
}

function extractNextData(html: string): string | null {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  return m?.[1] ?? null;
}

/** Primary: embedded JSON on full homedetails pages includes "homeStatus":"FOR_SALE" etc. */
function extractHomeStatusFromNextData(jsonText: string): string | null {
  const quoted = jsonText.match(/"homeStatus"\s*:\s*"([^"]+)"/);
  if (quoted?.[1]) return quoted[1];

  // Fallback: parse and walk (handles rare escaping differences).
  try {
    const obj = JSON.parse(jsonText) as unknown;
    let found: string | null = null;
    const walk = (v: unknown) => {
      if (found) return;
      if (v && typeof v === "object") {
        if (!Array.isArray(v) && "homeStatus" in v && typeof (v as { homeStatus?: unknown }).homeStatus === "string") {
          found = (v as { homeStatus: string }).homeStatus;
          return;
        }
        if (Array.isArray(v)) {
          for (const it of v) walk(it);
        } else {
          for (const it of Object.values(v)) walk(it);
        }
      }
    };
    walk(obj);
    return found;
  } catch {
    return null;
  }
}

function extractFirstHomedetailsUrl(html: string): string | null {
  const m = html.match(/https:\/\/www\.zillow\.com\/homedetails\/[^\s"'<>]+/);
  return m?.[0]?.replace(/["'<>].*$/, "") ?? null;
}

/**
 * GET /api/zillow/listing-status?address=...
 *
 * Reads Zillow's embedded page state (`__NEXT_DATA__`) for `homeStatus` (For Sale, Pending, Coming Soon, etc.):
 * `/homes/<address>_rb/` → canonical homedetails URL → parse `homeStatus`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const addressRaw = (searchParams.get("address") ?? "").trim();
  const address = normalizeAddress(addressRaw);

  if (!address) {
    return NextResponse.json({ ok: false, error: "Missing address" }, { status: 400 });
  }

  try {
    const searchUrl = `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`;

    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: BASE_HEADERS,
      redirect: "follow",
      cache: "no-store",
    });

    const searchHtml = await searchRes.text();
    if (!searchRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Zillow search failed (${searchRes.status})` },
        { status: 502 }
      );
    }

    const homedetailsUrl = extractFirstHomedetailsUrl(searchHtml);
    if (!homedetailsUrl) {
      return NextResponse.json(
        { ok: false, error: "Could not find a Zillow property page for this address." },
        { status: 404 }
      );
    }

    const detailsRes = await fetch(homedetailsUrl, {
      method: "GET",
      headers: {
        ...BASE_HEADERS,
        Referer: "https://www.zillow.com/",
      },
      redirect: "follow",
      cache: "no-store",
    });

    const detailsHtml = await detailsRes.text();
    if (!detailsRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Zillow property page failed (${detailsRes.status})` },
        { status: 502 }
      );
    }

    const nextPayload = extractNextData(detailsHtml);
    if (!nextPayload) {
      return NextResponse.json(
        { ok: false, error: "Zillow page did not include listing state." },
        { status: 502 }
      );
    }

    const homeStatus = extractHomeStatusFromNextData(nextPayload);
    if (!homeStatus) {
      return NextResponse.json(
        { ok: false, error: "Could not read homeStatus from Zillow." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        address,
        homeStatus,
        zillowUrl: homedetailsUrl,
      },
    });
  } catch (e) {
    console.error("Zillow listing-status error:", e);
    return NextResponse.json({ ok: false, error: "Failed to read Zillow listing status." }, { status: 502 });
  }
}
