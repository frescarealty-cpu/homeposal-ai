"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapIcon, Satellite } from "lucide-react";
import type { PropertyListing } from "@/data/properties";
import { SOCAL_COUNTIES } from "@/data/socalCounties";
import { buildPropertyPopupHTML } from "@/lib/propertyPopupHtml";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Southern California bounds
const SOCAL_BOUNDS = {
  north: 35.0,
  south: 32.5,
  east: -116.0,
  west: -118.7,
};

type MapStyleKey = "streets" | "satellite";

function streetViewImageUrl(lat: number, lng: number): string {
  if (!GOOGLE_MAPS_KEY) return "";
  return `https://maps.googleapis.com/maps/api/streetview?size=320x180&location=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
}

function aerialImageUrl(lat: number, lng: number): string {
  if (!GOOGLE_MAPS_KEY) return "";
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=320x180&scale=2&maptype=satellite&key=${GOOGLE_MAPS_KEY}`;
}

function buildAddressOnlyPopupHTML(address: string, lat: number, lng: number): string {
  const streetViewUrl = streetViewImageUrl(lat, lng);
  return `
    <div class="map-popup" style="
      font-family: system-ui, sans-serif;
      min-width: 260px;
      max-width: 320px;
      background: #1e293b;
      color: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
    ">
      ${streetViewUrl ? `
      <div style="width:100%;aspect-ratio:16/9;background:#0f172a;border-radius:6px;overflow:hidden;margin-bottom:12px">
        <img src="${streetViewUrl}" alt="Street View" style="width:100%;height:100%;object-fit:cover" />
      </div>
      ` : ""}
      <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8">Address</p>
      <p class="popup-address-text" style="margin:0 0 8px 0;font-weight:600;font-size:14px;color:#f1f5f9;line-height:1.4">${address.replace(/"/g, "&quot;")}</p>
      <button type="button" onclick="var p=this.previousElementSibling;navigator.clipboard.writeText(p.innerText).then(function(){this.textContent='Copied!'}.bind(this));setTimeout(function(){this.textContent='Copy address'}.bind(this),1500)" style="margin-bottom:12px;padding:4px 8px;font-size:11px;color:#94a3b8;background:transparent;border:1px solid #334155;border-radius:4px;cursor:pointer">Copy address</button>
      <div style="display:flex;flex-direction:column;gap:8px">
        <a href="/place?address=${encodeURIComponent(address)}&lat=${lat}&lng=${lng}#make-proposal" onclick="event.preventDefault();event.stopPropagation();window.location.href=this.getAttribute('href');return false" style="display:block;text-align:center;padding:10px 16px;background:#10b981;color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;cursor:pointer">Make Proposal</a>
        <a href="/place?address=${encodeURIComponent(address)}&lat=${lat}&lng=${lng}" onclick="event.preventDefault();event.stopPropagation();window.location.href=this.getAttribute('href');return false" style="display:block;text-align:center;padding:10px 16px;background:#3b82f6;color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;cursor:pointer">View Proposals</a>
      </div>
    </div>
  `;
}

const buildPopupHTML = buildPropertyPopupHTML;

type MapSectionProps = {
  properties: PropertyListing[];
  allProperties?: PropertyListing[];
  selectedPropertyId?: string | null;
  onPropertySelect?: (property: PropertyListing) => void;
  onPlaceSelect?: (place: { address: string; lat: number; lng: number }) => void;
  onPopupClose?: () => void;
  addressToShow?: { address: string; lat: number; lng: number } | null;
  isLoaded?: boolean;
  loadError?: Error | undefined;
  countySlug?: string;
};

export function MapSection({
  properties,
  allProperties,
  selectedPropertyId,
  onPropertySelect,
  onPlaceSelect,
  onPopupClose,
  addressToShow,
  isLoaded = false,
  loadError,
  countySlug,
}: MapSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clickMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const mapClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("satellite");
  const [mapReady, setMapReady] = useState(0);
  const [panRetry, setPanRetry] = useState(0);
  const onPropertySelectRef = useRef(onPropertySelect);
  onPropertySelectRef.current = onPropertySelect;
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  const lookupList = allProperties ?? properties;
  const propertyById = Object.fromEntries(lookupList.map((p) => [p.id, p]));

  // Global helper for map popup navigation (popup may run in iframe)
  useEffect(() => {
    (window as unknown as { __gotoProperty?: (id: string) => void }).__gotoProperty = (id: string) => {
      window.location.assign(`/property/${id}`);
    };
    return () => {
      delete (window as unknown as { __gotoProperty?: (id: string) => void }).__gotoProperty;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.google) return;

    if (!GOOGLE_MAPS_KEY) {
      setError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map");
      return;
    }

    const county = countySlug ? SOCAL_COUNTIES.find((c) => c.slug === countySlug) : null;
    const center = county
      ? { lat: county.lat, lng: county.lng }
      : { lat: 32.7157, lng: -117.1611 };
    const zoom = county ? county.zoom : 9;

    const map = new google.maps.Map(containerRef.current, {
      center,
      zoom,
      scrollwheel: true,
      gestureHandling: "greedy",
      mapTypeControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      streetViewControl: false,
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
      },
      mapTypeId: mapStyle === "satellite" ? "hybrid" : "roadmap",
      restriction: {
        latLngBounds: SOCAL_BOUNDS,
        strictBounds: true,
      },
      styles: mapStyle === "streets" ? [
        { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
      ] : undefined,
    });

    mapRef.current = map;
    setMapReady((r) => r + 1);

    const infoWindow = new google.maps.InfoWindow({ maxWidth: 340 });
    infoWindow.addListener("closeclick", () => onPopupClose?.());
    infoWindowRef.current = infoWindow;

    const geocoder = new google.maps.Geocoder();

    const mapClickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
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
          onPlaceSelectRef.current?.({ address: addr, lat, lng });
        }
        clickMarkerRef.current?.setMap(null);
        const tempMarker = new google.maps.Marker({
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
        clickMarkerRef.current = tempMarker;
        infoWindow.open(map, tempMarker);
      });
    });
    mapClickListenerRef.current = mapClickListener;

    // Prevent Ctrl+scroll from zooming the page; zoom the map instead
    const container = containerRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        const zoom = map.getZoom() ?? 9;
        map.setZoom(Math.max(1, Math.min(20, zoom + delta)));
      }
    };
    container?.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container?.removeEventListener("wheel", handleWheel);
      mapClickListenerRef.current?.remove();
      clickMarkerRef.current?.setMap(null);
      clickMarkerRef.current = null;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      infoWindow.close();
      mapRef.current = null;
      infoWindowRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !countySlug) return;

    const county = SOCAL_COUNTIES.find((c) => c.slug === countySlug);
    if (county) {
      map.panTo({ lat: county.lat, lng: county.lng });
      map.setZoom(county.zoom);
    }
  }, [countySlug]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || loadError) return;

    map.setMapTypeId(mapStyle === "satellite" ? "hybrid" : "roadmap");
    if (mapStyle === "streets") {
      map.setOptions({
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
          { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
        ],
      });
    } else {
      map.setOptions({ styles: [] });
    }
  }, [mapStyle, isLoaded, loadError]);

  useEffect(() => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !isLoaded || !infoWindow) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const markerData: { position: google.maps.LatLng; property: PropertyListing }[] = [];
    const blueCircleIcon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: "#3b82f6",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
    };

    properties.forEach((property) => {
      const lat = property.latitude;
      const lng = property.longitude;
      if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return;

      const marker = new google.maps.Marker({
        map,
        position: { lat, lng },
        icon: blueCircleIcon,
      });

      const position = new google.maps.LatLng(lat, lng);
      markerData.push({ position, property });
      markersRef.current.push(marker);

      marker.addListener("mouseover", () => {
        infoWindow.setContent(buildPopupHTML(property));
        infoWindow.setPosition(position);
        infoWindow.open(map);
      });
      marker.addListener("mouseout", () => infoWindow.close());
      marker.addListener("click", () => {
        infoWindow.setContent(buildPopupHTML(property));
        infoWindow.setPosition(position);
        infoWindow.open(map);
        onPropertySelectRef.current?.(property);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [properties, isLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!selectedPropertyId) return;
    if (!map) {
      if (panRetry < 30) {
        const id = setTimeout(() => setPanRetry((r) => r + 1), 200);
        return () => clearTimeout(id);
      }
      return;
    }

    const property = propertyById[selectedPropertyId];
    if (!property) return;

    const position = { lat: property.latitude, lng: property.longitude };

    map.panTo(position);
    map.setZoom(21);
    setTimeout(() => map.panTo(position), 100);
  }, [selectedPropertyId, propertyById, mapReady, panRetry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !countySlug) return;

    const county = SOCAL_COUNTIES.find((c) => c.slug === countySlug);
    if (county) {
      map.panTo({ lat: county.lat, lng: county.lng });
      map.setZoom(county.zoom);
    }
  }, [countySlug]);

  useEffect(() => {
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!addressToShow) {
      clickMarkerRef.current?.setMap(null);
      clickMarkerRef.current = null;
      if (infoWindow) infoWindow.close();
      return;
    }
    if (!map) {
      if (panRetry < 30) {
        const id = setTimeout(() => setPanRetry((r) => r + 1), 200);
        return () => clearTimeout(id);
      }
      return;
    }

    const { address, lat, lng } = addressToShow;
    const position = { lat, lng };
    // Offset pin ~2m north so it doesn't cover the address number on the map
    const OFFSET_DEG = 0.000018;
    const markerPosition = { lat: lat + OFFSET_DEG, lng };

    // Defer pan so Chrome (and other browsers) have map ready; then re-pan after a short delay so the map settles on the correct location (fixes Chrome first-select going to wrong place)
    let rafId = 0;
    let timeoutId = 0;
    rafId = requestAnimationFrame(() => {
      map.panTo(position);
      map.setZoom(21);
      timeoutId = window.setTimeout(() => {
        map.panTo(position);
      }, 120);
    });

    clickMarkerRef.current?.setMap(null);
    const pin = new google.maps.Marker({
      map,
      position: markerPosition,
      zIndex: 1000,
      icon: {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
        fillColor: "#10b981",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: 1.5,
        anchor: new google.maps.Point(12, 24),
      },
    });
    clickMarkerRef.current = pin;

    if (infoWindow) {
      pin.addListener("click", () => {
        infoWindow.setContent(buildAddressOnlyPopupHTML(address, lat, lng));
        infoWindow.open(map, pin);
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      pin.setMap(null);
      if (clickMarkerRef.current === pin) {
        clickMarkerRef.current = null;
      }
      if (infoWindow) infoWindow.close();
    };
  }, [addressToShow, mapReady, panRetry]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background-elevated)] p-6 text-center">
        <div className="rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-6 py-4">
          <p className="text-sm text-[var(--foreground-muted)]">Failed to load map</p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Ensure Maps JavaScript API is enabled in Google Cloud Console
          </p>
        </div>
      </div>
    );
  }

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background-elevated)] p-6 text-center">
        <div className="rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-6 py-4">
          <p className="text-sm text-[var(--foreground-muted)]">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--background-elevated)]">
        <p className="text-sm text-[var(--foreground-muted)]">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="homeposal-gmap relative h-full w-full min-w-0 overflow-hidden bg-[var(--background-elevated)]">
      <div
        ref={containerRef}
        className="absolute inset-0 min-h-0 min-w-0 overflow-hidden bg-[var(--background-elevated)] leading-[0]"
      />
      <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMapStyle("streets")}
          className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
            mapStyle === "streets"
              ? "bg-[#2C56A3] text-white"
              : "text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
          }`}
          aria-pressed={mapStyle === "streets"}
        >
          <MapIcon className="h-4 w-4" />
          Map
        </button>
        <button
          type="button"
          onClick={() => setMapStyle("satellite")}
          className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
            mapStyle === "satellite"
              ? "bg-[#2C56A3] text-white"
              : "text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
          }`}
          aria-pressed={mapStyle === "satellite"}
        >
          <Satellite className="h-4 w-4" />
          Satellite
        </button>
      </div>
    </div>
  );
}
