"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapIcon, Satellite } from "lucide-react";
import type { PropertyListing } from "@/data/properties";
import { SOCAL_COUNTIES } from "@/data/socalCounties";
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/** Close enough to read street names on satellite/hybrid (see mobile street search). */
const STREET_SEARCH_ZOOM = 18;
/** Tight satellite view when a full address is found (house ~¼ of map panel). */
const ADDRESS_SEARCH_ZOOM = 20;
/** ~90 m half-span for fitBounds framing at SoCal latitudes. */
const ADDRESS_BOUNDS_DELTA = 0.0008;

function focusMapOnAddress(
  map: google.maps.Map,
  lat: number,
  lng: number,
  isStreetSearch?: boolean
) {
  const position = { lat, lng };
  google.maps.event.trigger(map, "resize");

  if (isStreetSearch) {
    map.panTo(position);
    map.setZoom(STREET_SEARCH_ZOOM);
    return;
  }

  const bounds = new google.maps.LatLngBounds(
    { lat: lat - ADDRESS_BOUNDS_DELTA, lng: lng - ADDRESS_BOUNDS_DELTA },
    { lat: lat + ADDRESS_BOUNDS_DELTA, lng: lng + ADDRESS_BOUNDS_DELTA }
  );
  map.fitBounds(bounds, 56);

  google.maps.event.addListenerOnce(map, "idle", () => {
    let zoom = map.getZoom() ?? ADDRESS_SEARCH_ZOOM;
    if (zoom < ADDRESS_SEARCH_ZOOM) zoom = ADDRESS_SEARCH_ZOOM;
    if (zoom > 21) zoom = 21;
    map.setZoom(zoom);
    map.panTo(position);
  });
}

// Southern California bounds
const SOCAL_BOUNDS = {
  north: 35.0,
  south: 32.5,
  east: -116.0,
  west: -118.7,
};

type MapStyleKey = "streets" | "satellite";

type MapSectionProps = {
  properties: PropertyListing[];
  allProperties?: PropertyListing[];
  selectedPropertyId?: string | null;
  onPropertySelect?: (property: PropertyListing) => void;
  onPlaceSelect?: (place: { address: string; lat: number; lng: number }) => void;
  onPopupClose?: () => void;
  addressToShow?: {
    address: string;
    lat: number;
    lng: number;
    viewport?: { north: number; south: number; east: number; west: number };
    /** When true, fit the street viewport; otherwise use the standard close-up zoom. */
    isStreetSearch?: boolean;
  } | null;
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

    const triggerResize = () => {
      if (!mapRef.current) return;
      google.maps.event.trigger(mapRef.current, "resize");
    };
    requestAnimationFrame(triggerResize);
    const resizeTimeouts = [120, 350].map((ms) => window.setTimeout(triggerResize, ms));

    const resizeObserver =
      containerRef.current &&
      new ResizeObserver(() => {
        triggerResize();
      });
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const infoWindow = new google.maps.InfoWindow({ maxWidth: 340 });
    infoWindow.addListener("closeclick", () => onPopupClose?.());
    infoWindowRef.current = infoWindow;

    const geocoder = new google.maps.Geocoder();

    const mapClickListener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;

      infoWindow.close();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status !== "OK" || !results?.[0]) return;
        const addr = results[0].formatted_address ?? "";
        onPlaceSelectRef.current?.({ address: addr, lat, lng });
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
      resizeTimeouts.forEach((id) => window.clearTimeout(id));
      resizeObserver?.disconnect();
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
    if (!map || !countySlug || addressToShow) return;

    const county = SOCAL_COUNTIES.find((c) => c.slug === countySlug);
    if (county) {
      map.panTo({ lat: county.lat, lng: county.lng });
      map.setZoom(county.zoom);
    }
  }, [countySlug, addressToShow]);

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

      markersRef.current.push(marker);

      marker.addListener("click", (e: google.maps.MapMouseEvent) => {
        e.stop();
        infoWindow.close();
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

    const { lat, lng, isStreetSearch } = addressToShow;
    // Offset pin ~2m north so it doesn't cover the address number on the map
    const OFFSET_DEG = 0.000018;
    const markerPosition = { lat: lat + OFFSET_DEG, lng };

    let rafId = 0;
    let timeoutId = 0;
    let layoutTimeoutId = 0;
    const applyView = () => focusMapOnAddress(map, lat, lng, isStreetSearch);

    rafId = requestAnimationFrame(() => {
      applyView();
      timeoutId = window.setTimeout(applyView, 120);
      layoutTimeoutId = window.setTimeout(applyView, 450);
    });

    const resizeObserver =
      containerRef.current &&
      new ResizeObserver(() => {
        applyView();
      });
    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

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

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      clearTimeout(layoutTimeoutId);
      resizeObserver?.disconnect();
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
              ? "bg-[#1C4482] text-white"
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
