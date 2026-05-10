"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Satellite } from "lucide-react";
import { useGoogleMaps } from "./GoogleMapsProvider";
import { buildAddressOnlyPopupHTML } from "@/lib/mapAddressPopupHtml";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const SOCAL_BOUNDS = {
  north: 35.0,
  south: 32.5,
  east: -116.0,
  west: -118.7,
};

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

function useIsNarrowForInteractiveAerial() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return narrow;
}

export function StreetViewPanel({ latitude, longitude, address }: StreetViewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const aerialMapContainerRef = useRef<HTMLDivElement>(null);
  const aerialMapRef = useRef<google.maps.Map | null>(null);
  const propertyMarkerRef = useRef<google.maps.Marker | null>(null);
  const clickMarkerRef = useRef<google.maps.Marker | null>(null);
  const aerialInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const aerialClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const { isLoaded, loadError } = useGoogleMaps();
  const [hasStreetView, setHasStreetView] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("street");
  const isNarrow = useIsNarrowForInteractiveAerial();

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
          setViewMode("aerial");
        }
      }
    );
  }, [isLoaded, latitude, longitude]);

  const aerialUrl = aerialImageUrl(latitude, longitude);
  const showAerialFallback = hasStreetView === false || (hasStreetView === null && !!aerialUrl);
  const showViewToggle = hasStreetView === true && !!aerialUrl;
  const effectiveViewMode: ViewMode = !aerialUrl ? viewMode : hasStreetView === true ? viewMode : "aerial";

  const showAerialUi =
    showAerialFallback || (hasStreetView === true && viewMode === "aerial" && !!aerialUrl);

  const useInteractiveMobileAerial =
    isNarrow && hasStreetView !== null && showAerialUi && !!GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!useInteractiveMobileAerial || !isLoaded || !aerialMapContainerRef.current || !window.google) {
      return;
    }

    const el = aerialMapContainerRef.current;
    const map = new google.maps.Map(el, {
      center: { lat: latitude, lng: longitude },
      zoom: 19,
      scrollwheel: true,
      gestureHandling: "greedy",
      mapTypeControl: true,
      mapTypeId: "hybrid",
      fullscreenControl: true,
      restriction: {
        latLngBounds: SOCAL_BOUNDS,
        strictBounds: true,
      },
    });

    aerialMapRef.current = map;
    const infoWindow = new google.maps.InfoWindow({ maxWidth: 340 });
    aerialInfoWindowRef.current = infoWindow;

    propertyMarkerRef.current?.setMap(null);
    propertyMarkerRef.current = new google.maps.Marker({
      map,
      position: { lat: latitude, lng: longitude },
      title: address ?? "This listing",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#10b981",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    const geocoder = new google.maps.Geocoder();
    aerialClickListenerRef.current = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          infoWindow.setContent(`
            <div style="padding:16px;background:#1e293b;color:#f1f5f9;border-radius:8px">
              <p style="margin:0;font-size:14px">No address found for this location.</p>
              <p style="margin:8px 0 0 0;font-size:12px;color:#94a3b8">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            </div>
          `);
        } else {
          const addr = results[0].formatted_address ?? "";
          infoWindow.setContent(buildAddressOnlyPopupHTML(addr, lat, lng));
        }
        clickMarkerRef.current?.setMap(null);
        clickMarkerRef.current = new google.maps.Marker({
          map,
          position: { lat, lng },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
        infoWindow.open(map, clickMarkerRef.current);
      });
    });

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        const z = map.getZoom() ?? 19;
        map.setZoom(Math.max(15, Math.min(21, z + delta)));
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", handleWheel);
      aerialClickListenerRef.current?.remove();
      aerialClickListenerRef.current = null;
      clickMarkerRef.current?.setMap(null);
      clickMarkerRef.current = null;
      infoWindow.close();
      aerialInfoWindowRef.current = null;
      propertyMarkerRef.current?.setMap(null);
      propertyMarkerRef.current = null;
      aerialMapRef.current = null;
    };
  }, [useInteractiveMobileAerial, isLoaded, latitude, longitude, address]);

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
          {useInteractiveMobileAerial && (
            <p className="mt-1 text-xs text-[var(--foreground-muted)] lg:hidden">
              Drag to move. Tap the map to pick another address (opens actions for that spot).
            </p>
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
        {showAerialUi && (
          <>
            <div
              ref={aerialMapContainerRef}
              className="absolute inset-0 z-10 h-full w-full lg:hidden"
              aria-label="Interactive satellite map"
            />
            {aerialUrl && (
              <>
                <img
                  src={aerialUrl}
                  alt={
                    viewMode === "aerial" || hasStreetView === false
                      ? "Aerial view of property"
                      : "Loading…"
                  }
                  className={`pointer-events-none absolute inset-0 z-[5] h-full w-full object-cover ${
                    useInteractiveMobileAerial ? "hidden lg:block" : "block"
                  }`}
                />
                {(viewMode === "aerial" || hasStreetView === false) && !useInteractiveMobileAerial && (
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[15] -translate-x-1/2 -translate-y-full"
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
