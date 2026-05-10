"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Satellite } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function aerialImageUrl(lat: number, lng: number): string {
  if (!GOOGLE_MAPS_KEY) return "";
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=640x360&scale=2&maptype=satellite&key=${GOOGLE_MAPS_KEY}`;
}

type StreetViewPanelProps = {
  latitude: number;
  longitude: number;
  address?: string;
};

type ViewMode = "street" | "aerial";

export function StreetViewPanel({ latitude, longitude, address }: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const [hasStreetView, setHasStreetView] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("street");

  useEffect(() => {
    setHasStreetView(null);
    setViewMode("street");
  }, [latitude, longitude]);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.google) return;

    const streetViewService = new google.maps.StreetViewService();
    streetViewService.getPanorama(
      { location: { lat: latitude, lng: longitude }, radius: 50 },
      (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          const panorama = new google.maps.StreetViewPanorama(containerRef.current!, {
            position: { lat: latitude, lng: longitude },
            pov: { heading: 34, pitch: 10 },
            zoom: 1,
            addressControl: false,
            fullscreenControl: true,
            enableCloseButton: false,
          });
          const panoLatLng = data.location.latLng;
          const targetLatLng = new google.maps.LatLng(latitude, longitude);
          panorama.setPosition(panoLatLng);
          if (window.google?.maps?.geometry?.spherical) {
            const heading = google.maps.geometry.spherical.computeHeading(panoLatLng, targetLatLng);
            panorama.setPov({ heading, pitch: 0 });
          }
          setHasStreetView(true);
        } else {
          setHasStreetView(false);
          // When street view is unavailable, we fall back to aerial imagery.
          // Ensure the header label reflects what the user is actually seeing.
          setViewMode("aerial");
        }
      }
    );
  }, [isLoaded, latitude, longitude]);

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="kalshi-border flex aspect-video items-center justify-center rounded-md bg-[var(--background-elevated)] p-6 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Street View
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="kalshi-border flex aspect-video items-center justify-center rounded-md bg-[var(--background-elevated)] p-6 text-center">
        <p className="text-sm text-[var(--foreground-muted)]">Failed to load Street View</p>
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Ensure Maps JavaScript API and Street View are enabled in Google Cloud Console
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="kalshi-border flex aspect-video items-center justify-center rounded-md bg-[var(--background-elevated)]">
        <p className="text-sm text-[var(--foreground-muted)]">Loading Street View…</p>
      </div>
    );
  }

  const aerialUrl = aerialImageUrl(latitude, longitude);
  const showAerialFallback = hasStreetView === false || (hasStreetView === null && aerialUrl);
  const showViewToggle = hasStreetView === true && !!aerialUrl;
  const effectiveViewMode: ViewMode = !aerialUrl ? viewMode : hasStreetView === true ? viewMode : "aerial";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {effectiveViewMode === "aerial" ? "Aerial View" : "Street View"}
          </h3>
          {address && (
            <p className="text-xs text-[var(--foreground-muted)]">{address}</p>
          )}
        </div>
        {showViewToggle && (
          <div className="flex rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("street")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "street"
                  ? "bg-[#2C56A3] text-white"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              aria-pressed={viewMode === "street"}
            >
              <MapPin className="h-3.5 w-3.5" />
              Street View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("aerial")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "aerial"
                  ? "bg-[#2C56A3] text-white"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              }`}
              aria-pressed={viewMode === "aerial"}
            >
              <Satellite className="h-3.5 w-3.5" />
              Aerial View
            </button>
          </div>
        )}
      </div>
      <div className="relative aspect-video w-full overflow-hidden rounded-md border border-[var(--border)]">
        <div
          ref={containerRef}
          className={`absolute inset-0 h-full w-full ${viewMode === "aerial" || hasStreetView === false ? "hidden" : ""}`}
          aria-hidden={viewMode === "aerial" || hasStreetView === false}
        />
        {(showAerialFallback || (viewMode === "aerial" && aerialUrl)) && (
          <>
            <img
              src={aerialUrl}
              alt={viewMode === "aerial" || hasStreetView === false ? "Aerial view of property" : "Loading…"}
              className="absolute inset-0 z-10 h-full w-full object-cover"
            />
            {viewMode === "aerial" && (
              <div
                className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full pointer-events-none"
                aria-hidden
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-md"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </>
        )}
        {hasStreetView === null && !aerialUrl && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background-elevated)]">
            <p className="text-sm text-[var(--foreground-muted)]">Loading…</p>
          </div>
        )}
      </div>
    </div>
  );
}
