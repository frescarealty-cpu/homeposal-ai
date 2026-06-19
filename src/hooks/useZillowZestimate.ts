"use client";

import { useEffect, useMemo, useState } from "react";
import type { ZillowZestimatePayload } from "@/types/zillow";

export function useZillowZestimate(
  address: string,
  lat?: number,
  lng?: number,
  enabled = true
) {
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ZillowZestimatePayload | null>(null);

  const normalizedAddress = useMemo(() => address.trim(), [address]);
  const lookupAddress = useMemo(
    () => normalizedAddress.replace(/,\s*(usa|united states)$/i, "").trim(),
    [normalizedAddress]
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    async function run() {
      if (!lookupAddress) {
        setLoading(false);
        setError("Address is required.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("address", lookupAddress);
        if (typeof lat === "number" && Number.isFinite(lat)) qs.set("lat", String(lat));
        if (typeof lng === "number" && Number.isFinite(lng)) qs.set("lng", String(lng));

        const res = await fetch(`/api/zillow/zestimate?${qs.toString()}`);
        const json = (await res.json().catch(() => null)) as
          | { ok: true; data: ZillowZestimatePayload }
          | { ok?: false; error?: string };

        if (!res.ok || !json || json.ok !== true) {
          const msg =
            json && "error" in json && typeof json.error === "string"
              ? json.error
              : "Unable to load data.";
          if (!cancelled) {
            setData(null);
            setError(msg);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setData(json.data);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        console.error("Zillow estimate fetch failed:", e);
        if (!cancelled) {
          setData(null);
          setError("Unable to load data.");
          setLoading(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [lookupAddress, lat, lng, enabled]);

  return { loading: enabled ? loading : false, error: enabled ? error : null, data: enabled ? data : null, normalizedAddress, lookupAddress };
}
