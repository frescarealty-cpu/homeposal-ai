"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
import { MOCK_PROPERTIES } from "@/data/properties";
import {
  geocodeSoCalAddress,
  resolvePropertyOrPlacePath,
  SOCAL_BOUNDS,
} from "@/lib/propertyAddressLookup";

type OwnerAddressCheckPanelProps = {
  /** Increment to request focus on the input (e.g. after "Check my address"). */
  focusToken?: number;
  className?: string;
};

export function OwnerAddressCheckPanel({
  focusToken = 0,
  className = "",
}: OwnerAddressCheckPanelProps) {
  const router = useRouter();
  const { isLoaded } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigateTo = useCallback(
    (address: string, lat: number, lng: number) => {
      const path = resolvePropertyOrPlacePath(MOCK_PROPERTIES, address, lat, lng);
      router.push(path);
    },
    [router]
  );

  const handleResolvedAddress = useCallback(
    async (address: string, lat: number, lng: number) => {
      setError(null);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setLoading(true);
        const geocoded = await geocodeSoCalAddress(address);
        setLoading(false);
        if (!geocoded) {
          setError("Address not found in Southern California. Try including city and state.");
          return;
        }
        navigateTo(geocoded.address, geocoded.lat, geocoded.lng);
        return;
      }
      navigateTo(address, lat, lng);
    },
    [navigateTo]
  );

  useEffect(() => {
    if (focusToken > 0) {
      inputRef.current?.focus();
    }
  }, [focusToken]);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
      new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
    );

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      bounds,
      strictBounds: true,
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: ["formatted_address", "geometry", "name"],
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || place.name || "";
      const loc = place.geometry?.location;
      if (!address) return;
      if (loc) {
        void handleResolvedAddress(address, loc.lat(), loc.lng());
        return;
      }
      void handleResolvedAddress(address, NaN, NaN);
    });

    return () => {
      google.maps.event.removeListener(listener);
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, handleResolvedAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value?.trim() ?? "";
    if (!value) return;
    setLoading(true);
    setError(null);
    const geocoded = await geocodeSoCalAddress(value);
    setLoading(false);
    if (!geocoded) {
      setError("Address not found in Southern California. Try including city and state.");
      return;
    }
    navigateTo(geocoded.address, geocoded.lat, geocoded.lng);
  };

  return (
    <div
      className={[
        "rounded-lg border border-[var(--border)] bg-[var(--background)]/80 p-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="mb-2 text-xs font-medium text-[var(--foreground)]">Check your home address</p>
      <form onSubmit={handleSubmit} className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter your address..."
            autoComplete="off"
            disabled={loading}
            className="w-full min-h-[40px] rounded-md border border-[var(--border)] bg-[var(--background-elevated)] py-2 pl-8 pr-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            aria-label="Your home address"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-md bg-[#2C56A3] px-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Go
        </button>
      </form>
      {error ? <p className="mt-2 text-[0.6875rem] text-rose-500">{error}</p> : null}
    </div>
  );
}
