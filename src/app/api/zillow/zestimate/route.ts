import { NextResponse } from "next/server";
import type { ZillowZestimatePayload } from "@/types/zillow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickFirstNumber(obj: any, paths: string[]): number | null {
  for (const p of paths) {
    const val = p.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
    const n = asNumber(val);
    if (n != null) return n;
  }
  return null;
}

function deepFindNumber(
  obj: unknown,
  keyRegex: RegExp,
  opts?: { maxDepth?: number; maxNodes?: number }
): { value: number; path: string } | null {
  const maxDepth = opts?.maxDepth ?? 10;
  const maxNodes = opts?.maxNodes ?? 20000;

  const seen = new Set<any>();
  let nodes = 0;

  function walk(cur: any, path: string, depth: number): { value: number; path: string } | null {
    nodes += 1;
    if (nodes > maxNodes) return null;
    if (cur == null) return null;
    if (depth > maxDepth) return null;
    if (typeof cur !== "object") return null;
    if (seen.has(cur)) return null;
    seen.add(cur);

    if (Array.isArray(cur)) {
      for (let i = 0; i < cur.length; i++) {
        const hit = walk(cur[i], `${path}[${i}]`, depth + 1);
        if (hit) return hit;
      }
      return null;
    }

    for (const [k, v] of Object.entries(cur)) {
      const nextPath = path ? `${path}.${k}` : k;

      if (keyRegex.test(k)) {
        const direct = asNumber(v);
        if (direct != null) return { value: direct, path: nextPath };

        // Common pattern: { zestimate: { amount: 123 } } or similar
        if (v && typeof v === "object") {
          const amount = asNumber((v as any).amount ?? (v as any).value ?? (v as any).price);
          if (amount != null) return { value: amount, path: `${nextPath}.(amount|value|price)` };
        }
      }

      const hit = walk(v, nextPath, depth + 1);
      if (hit) return hit;
    }

    return null;
  }

  return walk(obj as any, "", 0);
}

/**
 * GET /api/zillow/zestimate?address=...
 *
 * This is intentionally flexible because different “Zestimate API” providers return
 * different shapes. Configure via env vars:
 * - ZESTIMATE_API_URL (required): full URL to call (without address), e.g. https://.../zestimate
 * - ZESTIMATE_API_KEY (optional): sent as Authorization: Bearer <key>
 * - ZESTIMATE_API_KEY_HEADER (optional): override header name (e.g. "X-API-Key")
 * - ZESTIMATE_API_HOST_HEADER + ZESTIMATE_API_HOST (optional): for RapidAPI-style hosts
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") ?? "").trim();
  const lat = (searchParams.get("lat") ?? "").trim();
  const lng = (searchParams.get("lng") ?? "").trim();

  if (!address) {
    return NextResponse.json({ ok: false, error: "Missing address" }, { status: 400 });
  }

  const baseUrl = process.env.ZESTIMATE_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { ok: false, error: "Zestimate API is not configured (missing ZESTIMATE_API_URL)." },
      { status: 501 }
    );
  }

  const url = new URL(baseUrl);
  // Most providers accept `address`, but allow overrides via env.
  const addressParam = (process.env.ZESTIMATE_API_ADDRESS_PARAM ?? "address").trim() || "address";
  if (!url.searchParams.has(addressParam)) url.searchParams.set(addressParam, address);

  // Optional coordinate support (helps providers match addresses reliably).
  const latParam = (process.env.ZESTIMATE_API_LAT_PARAM ?? "").trim();
  const lngParam = (process.env.ZESTIMATE_API_LNG_PARAM ?? "").trim();
  if (latParam && lat && !url.searchParams.has(latParam)) url.searchParams.set(latParam, lat);
  if (lngParam && lng && !url.searchParams.has(lngParam)) url.searchParams.set(lngParam, lng);

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const key = process.env.ZESTIMATE_API_KEY;
  const keyHeader = (process.env.ZESTIMATE_API_KEY_HEADER ?? "").trim();
  let keyQueryParam = (process.env.ZESTIMATE_API_KEY_QUERY_PARAM ?? "").trim();
  // Bridge Data Output endpoints typically require `access_token` as a query param.
  // Make this resilient if the env var is missing/misconfigured.
  if (!keyQueryParam && url.hostname.includes("bridgedataoutput.com")) {
    keyQueryParam = "access_token";
  }
  if (key) {
    if (keyQueryParam) {
      // Some providers (e.g. Bridge Data Output) require access_token in query string.
      if (!url.searchParams.has(keyQueryParam)) url.searchParams.set(keyQueryParam, key);
    } else if (keyHeader) {
      headers[keyHeader] = key;
    } else {
      headers.Authorization = `Bearer ${key}`;
    }
  }

  const hostHeader = (process.env.ZESTIMATE_API_HOST_HEADER ?? "").trim();
  const hostValue = (process.env.ZESTIMATE_API_HOST ?? "").trim();
  if (hostHeader && hostValue) headers[hostHeader] = hostValue;

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // leave as null
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Zestimate API request failed (${res.status})`,
          upstream: typeof json === "object" && json ? json : text?.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const anyJson: any = json;

    // Some providers return { bundle: [], total: 0 } for “no match”.
    const total = asNumber(anyJson?.total);
    const bundle = Array.isArray(anyJson?.bundle) ? anyJson.bundle : null;
    if ((total === 0 || (typeof total === "number" && total <= 0)) || (bundle && bundle.length === 0)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No Zestimate data found for this address. Try a more specific address (include unit #) or ensure your provider supports lookups by address/coordinates.",
          upstreamPreview: {
            topLevelKeys: anyJson && typeof anyJson === "object" ? Object.keys(anyJson).slice(0, 50) : [],
            sample: anyJson,
          },
        },
        { status: 404 }
      );
    }

    // Bridge Data Output (zestimates_v2) convenience extraction.
    const firstBundle = Array.isArray(anyJson?.bundle) && anyJson.bundle.length > 0 ? anyJson.bundle[0] : null;
    const bridgeZestimate = firstBundle ? asNumber(firstBundle.zestimate) : null;
    const bridgeRent = firstBundle ? asNumber(firstBundle.rentalZestimate ?? firstBundle.rentZestimate) : null;

    const bridgeLowPercent = firstBundle ? asNumber(firstBundle.lowPercent) : null;
    const bridgeHighPercent = firstBundle ? asNumber(firstBundle.highPercent) : null;
    const bridgeRangeLow =
      bridgeZestimate != null && bridgeLowPercent != null
        ? Math.round(bridgeZestimate * (1 - bridgeLowPercent / 100))
        : null;
    const bridgeRangeHigh =
      bridgeZestimate != null && bridgeHighPercent != null
        ? Math.round(bridgeZestimate * (1 + bridgeHighPercent / 100))
        : null;

    // Attempt to normalize common field names.
    const zestimateUsd = pickFirstNumber(anyJson, [
      "zestimate",
      "zestimateUsd",
      "zestimateUSD",
      "value",
      "price",
      "data.zestimate",
      "data.value",
      "property.zestimate",
      "property.zestimate.amount",
      "property.zestimate.value",
      // Some providers nest results in an array/bundle
      "bundle.0.zestimate",
      "bundle.0.property.zestimate",
      "bundle.0.property.zestimate.amount",
      "bundle.0.property.zestimate.value",
    ]);

    const rentZestimateUsd = pickFirstNumber(anyJson, [
      "rentZestimate",
      "rentZestimateUsd",
      "rentZestimateUSD",
      "rent",
      "data.rentZestimate",
      "property.rentZestimate",
      "property.rentZestimate.amount",
      "property.rentZestimate.value",
      "bundle.0.rentZestimate",
      "bundle.0.property.rentZestimate",
      "bundle.0.property.rentZestimate.amount",
      "bundle.0.property.rentZestimate.value",
    ]);

    const zestimateRangeLowUsd = pickFirstNumber(anyJson, [
      "zestimateRangeLow",
      "zestimateRangeLowUsd",
      "zestimateLow",
      "data.zestimateRangeLow",
      "property.zestimateRange.low",
      "property.zestimate.low",
      "property.zestimate.valuationRange.low",
      "bundle.0.property.zestimateRange.low",
      "bundle.0.property.zestimate.valuationRange.low",
    ]);

    const zestimateRangeHighUsd = pickFirstNumber(anyJson, [
      "zestimateRangeHigh",
      "zestimateRangeHighUsd",
      "zestimateHigh",
      "data.zestimateRangeHigh",
      "property.zestimateRange.high",
      "property.zestimate.high",
      "property.zestimate.valuationRange.high",
      "bundle.0.property.zestimateRange.high",
      "bundle.0.property.zestimate.valuationRange.high",
    ]);

    // If direct paths fail, fall back to a deep search for keys that look like “zestimate”.
    const zestimateFallback =
      zestimateUsd ?? bridgeZestimate ?? deepFindNumber(anyJson, /zestimate/i)?.value ?? null;
    const rentFallback =
      rentZestimateUsd ?? bridgeRent ?? deepFindNumber(anyJson, /rent.*zestimate|zestimate.*rent/i)?.value ?? null;

    const lastUpdatedCandidate =
      (firstBundle?.BridgeModificationTimestamp ??
        firstBundle?.timestamp ??
        firstBundle?.rentalTimestamp ??
        anyJson?.lastUpdated ??
        anyJson?.updatedAt ??
        anyJson?.date) as unknown;
    const lastUpdated = typeof lastUpdatedCandidate === "string" ? String(lastUpdatedCandidate) : null;

    const payload: ZillowZestimatePayload = {
      address,
      zestimateUsd: zestimateFallback,
      rentZestimateUsd: rentFallback,
      zestimateRangeLowUsd: zestimateRangeLowUsd ?? bridgeRangeLow,
      zestimateRangeHighUsd: zestimateRangeHighUsd ?? bridgeRangeHigh,
      lastUpdated,
      raw: json,
    };

    const hasAnyNumber =
      payload.zestimateUsd != null ||
      payload.rentZestimateUsd != null ||
      payload.zestimateRangeLowUsd != null ||
      payload.zestimateRangeHighUsd != null;

    if (!hasAnyNumber) {
      // Important: some providers successfully match a property (bundle/zpid/status)
      // but omit numeric estimate fields for certain addresses. In that case, we
      // still return ok:true so the UI can:
      // - show "—" for missing estimates (instead of "data unavailable")
      // - still use `raw` to detect whether the property is listed on Zillow.
      const hasMatchedProperty =
        !!firstBundle ||
        typeof anyJson?.zpid === "string" ||
        typeof anyJson?.homeStatus === "string" ||
        typeof anyJson?.listingStatus === "string";

      if (hasMatchedProperty) {
        return NextResponse.json({ ok: true, data: payload });
      }

      // Provider returned a JSON shape we don't recognize AND we don't have any
      // indication we even matched a property. Surface an error for debugging.
      const upstreamPreview =
        anyJson && typeof anyJson === "object"
          ? {
              topLevelKeys: Object.keys(anyJson).slice(0, 50),
              sample: anyJson,
            }
          : json;

      return NextResponse.json(
        {
          ok: false,
          error:
            "Zestimate API response did not include a recognizable estimate field. Configure the provider mapping or adjust the parser.",
          upstreamPreview,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data: payload });
  } catch (e) {
    console.error("Zestimate API error:", e);
    const err =
      e && typeof e === "object" && "message" in e && typeof (e as any).message === "string"
        ? String((e as any).message)
        : null;
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to reach Zestimate API.",
        ...(err ? { detail: err } : null),
      },
      { status: 502 }
    );
  }
}

