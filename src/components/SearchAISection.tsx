"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, MapPin, X } from "lucide-react";
import type { PropertyListing } from "@/data/properties";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Southern California: all 9 counties (Imperial, San Diego, Orange, LA, Riverside, San Bernardino, Ventura, Santa Barbara, Kern)
const SOCAL_BOUNDS = {
  north: 35.5,
  south: 32.5,
  east: -115.0,  // Imperial Valley
  west: -120.5,  // Ventura / Santa Barbara
};

export type PlaceViewport = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type PlaceResult = {
  address: string;
  lat: number;
  lng: number;
  viewport?: PlaceViewport;
  /** True when the search is a street/route only (no specific street number). */
  isStreetSearch?: boolean;
};

/** Street-name searches (route) vs full addresses (street number / premise). */
function isStreetNameOnlyGeocodeResult(result: google.maps.GeocoderResult): boolean {
  const types = result.types ?? [];
  const hasStreetNumber = (result.address_components ?? []).some((c) =>
    c.types.includes("street_number")
  );
  if (hasStreetNumber) return false;
  if (
    types.includes("street_address") ||
    types.includes("premise") ||
    types.includes("subpremise")
  ) {
    return false;
  }
  return types.includes("route") || types.includes("intersection");
}

type SearchAISectionProps = {
  value?: string;
  onChange?: (query: string) => void;
  onPlaceSelect?: (place: PlaceResult) => void;
  onPropertySelect?: (property: PropertyListing) => void;
  onNavigateToProperty?: (property: PropertyListing) => void;
  properties?: PropertyListing[];
  filteredProperties?: PropertyListing[];
  placeholder?: string;
  isLoaded?: boolean;
};

function findPropertyByLocation(
  properties: PropertyListing[],
  lat: number,
  lng: number
): PropertyListing | null {
  const threshold = 0.01;
  let best: { p: PropertyListing; d: number } | null = null;
  for (const p of properties) {
    const d = Math.sqrt(Math.pow(p.latitude - lat, 2) + Math.pow(p.longitude - lng, 2));
    if (d < threshold && (!best || d < best.d)) best = { p, d };
  }
  return best?.p ?? null;
}

function findPropertyByAddress(
  properties: PropertyListing[],
  address: string
): PropertyListing | null {
  const normalized = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/,/g, "")
      .trim();
  const a = normalized(address);
  for (const p of properties) {
    const full = `${p.address}, ${p.city}, ${p.state} ${p.zipCode}`;
    if (normalized(full) === a || normalized(full).includes(a) || a.includes(normalized(p.address))) {
      return p;
    }
  }
  return null;
}

/** Returns true if the place looks like a street/home address (not only an establishment or POI). */
function isStreetAddress(place: google.maps.places.PlaceResult): boolean {
  const types = place.types ?? [];
  if (types.includes("street_address") || types.includes("premise") || types.includes("subpremise")) return true;
  if (types.includes("establishment") || types.includes("point_of_interest")) return false;
  const comps = place.address_components ?? [];
  const hasStreet = comps.some((c) => c.types.includes("street_number") || c.types.includes("route"));
  return hasStreet || types.length === 0;
}

function runLocateWithPlace(
  place: google.maps.places.PlaceResult,
  properties: PropertyListing[],
  onPlaceSelect?: (place: PlaceResult) => void,
  onPropertySelect?: (property: PropertyListing) => void,
  onNavigateToProperty?: (property: PropertyListing) => void
): "navigated" | "placed" | false {
  const addr = place.formatted_address || place.name || "";
  const loc = place.geometry?.location;
  if (loc && addr) {
    const lat = loc.lat();
    const lng = loc.lng();
    const match =
      findPropertyByLocation(properties, lat, lng) ?? findPropertyByAddress(properties, addr);
    if (match) {
      onPropertySelect?.(match);
      onNavigateToProperty?.(match);
      window.dispatchEvent(new CustomEvent("homeposal-select-property", { detail: { property: match } }));
      return "navigated";
    }
    // Do NOT call onPlaceSelect here with place geometry — it can be wrong. Caller should geocode addr instead (same as Find button).
    return "placed";
  }
  return false;
}

function locateAndSelect(
  address: string,
  properties: PropertyListing[],
  onPlaceSelect?: (place: PlaceResult) => void,
  onPropertySelect?: (property: PropertyListing) => void,
  onNavigateToProperty?: (property: PropertyListing) => void
) {
  if (!address.trim() || !window.google?.maps) return;

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: address.trim(), bounds: new google.maps.LatLngBounds(
    new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
    new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
  ) }, (results, status) => {
    if (status !== "OK" || !results?.[0]) return;
    const loc = results[0].geometry?.location;
    const addr = results[0].formatted_address;
    if (!loc || !addr) return;
    const lat = loc.lat();
    const lng = loc.lng();
    // Only accept addresses within Southern California bounds
    if (lat < SOCAL_BOUNDS.south || lat > SOCAL_BOUNDS.north || lng < SOCAL_BOUNDS.west || lng > SOCAL_BOUNDS.east) return;
    const match = findPropertyByLocation(properties, lat, lng) ?? findPropertyByAddress(properties, addr);
    if (match) {
      onPropertySelect?.(match);
      onNavigateToProperty?.(match);
      window.dispatchEvent(new CustomEvent("homeposal-select-property", { detail: { property: match } }));
    } else {
      const viewport = results[0].geometry?.viewport;
      const isStreetSearch = isStreetNameOnlyGeocodeResult(results[0]);
      onPlaceSelect?.({
        address: addr,
        lat,
        lng,
        isStreetSearch,
        viewport: viewport
          ? {
              north: viewport.getNorthEast().lat(),
              south: viewport.getSouthWest().lat(),
              east: viewport.getNorthEast().lng(),
              west: viewport.getSouthWest().lng(),
            }
          : undefined,
      });
    }
  });
}

export function SearchAISection({
  value = "",
  onChange,
  onPlaceSelect,
  onPropertySelect,
  onNavigateToProperty,
  properties = [],
  filteredProperties = [],
  placeholder = "Enter an address or street name...",
  isLoaded = false,
}: SearchAISectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);

  const [effectivePlaceholder, setEffectivePlaceholder] = useState(placeholder);
  useEffect(() => {
    const update = () => setEffectivePlaceholder(placeholder);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [placeholder]);

  // Sync when parent passes a new value (e.g. after selecting a place on the map)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = value;
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google?.maps?.places) return;

    const bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
      new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
    );

    // Restrict to address type only (street addresses); avoids establishments/POI in dropdown.
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      bounds,
      strictBounds: true,
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: ["formatted_address", "geometry", "address_components", "name", "place_id", "types"],
    });

    // When user selects from Google dropdown: if it matches a property, navigate immediately and do NOT fill the search box.
    // Only fill the search box when showing the place on the map (no property match).
    // If the selection is an establishment/POI (not a street address), resolve it via Geocoder to get the actual street address.
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      let addr = place.formatted_address || place.name || "";
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
      }
      const tryWithPlace = (p: google.maps.places.PlaceResult): "navigated" | "placed" | false => {
        const result = runLocateWithPlace(p, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
        if (result === "navigated") {
          if (inputRef.current) {
            inputRef.current.value = "";
            setQuery("");
            onChange?.("");
          }
          return "navigated";
        }
        if (result === "placed") {
          const a = p.formatted_address || p.name || "";
          if (a && inputRef.current) {
            inputRef.current.value = a;
            setQuery(a);
            onChange?.(a);
          }
          return "placed";
        }
        return false;
      };

      if (addr && place.geometry?.location && !isStreetAddress(place)) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          {
            address: addr,
            bounds: new google.maps.LatLngBounds(
              new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
              new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
            ),
          },
          (results, status) => {
            if (status === "OK" && results?.[0]) {
              const r = results[0];
              const resolvedPlace: google.maps.places.PlaceResult = {
                formatted_address: r.formatted_address,
                geometry: r.geometry,
                name: r.formatted_address,
              };
              const res = tryWithPlace(resolvedPlace);
              if (res === "navigated") return;
              if (res === "placed") {
                const a = resolvedPlace.formatted_address || "";
                if (a) locateAndSelect(a, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
                return;
              }
            }
            const res = tryWithPlace(place);
            if (res === "navigated") return;
            if (res === "placed") {
              if (addr) locateAndSelect(addr, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
              return;
            }
          }
        );
        return;
      }

      const placeResult = tryWithPlace(place);
      if (placeResult === "navigated") return;
      if (placeResult === "placed") {
        if (addr) locateAndSelect(addr, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
        return;
      }

      if (place.place_id && window.google?.maps?.places) {
        const service = new google.maps.places.PlacesService(document.createElement("div"));
        service.getDetails(
          {
            placeId: place.place_id,
            fields: ["formatted_address", "geometry", "name"],
          },
          (placeDetails, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !placeDetails) return;
            const detailsAddr = placeDetails.formatted_address || placeDetails.name || addr;
            const detailResult = runLocateWithPlace(
              {
                formatted_address: placeDetails.formatted_address,
                name: placeDetails.name,
                geometry: placeDetails.geometry,
              },
              properties,
              onPlaceSelect,
              onPropertySelect,
              onNavigateToProperty
            );
            if (detailResult === "navigated") {
              if (inputRef.current) {
                inputRef.current.value = "";
                setQuery("");
                onChange?.("");
              }
              return;
            }
            if (detailResult === "placed" && inputRef.current && detailsAddr) {
              if (inputRef.current) {
                inputRef.current.value = detailsAddr;
              }
              setQuery(detailsAddr);
              onChange?.(detailsAddr);
              locateAndSelect(detailsAddr, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
            }
            if (detailResult === false && detailsAddr) {
              const matchByAddr = findPropertyByAddress(properties, detailsAddr);
              if (matchByAddr) {
                onNavigateToProperty?.(matchByAddr);
                if (inputRef.current) {
                  inputRef.current.value = "";
                  setQuery("");
                  onChange?.("");
                }
                return;
              }
              if (inputRef.current) {
                inputRef.current.value = detailsAddr;
              }
              setQuery(detailsAddr);
              onChange?.(detailsAddr);
              locateAndSelect(detailsAddr, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
            }
          }
        );
        return;
      }
      const fallbackAddr = addr.trim() || (inputRef.current?.value?.trim() ?? "");
      if (fallbackAddr) {
        const matchByAddr = findPropertyByAddress(properties, fallbackAddr);
        if (matchByAddr) {
          onNavigateToProperty?.(matchByAddr);
          if (inputRef.current) {
            inputRef.current.value = "";
            setQuery("");
            onChange?.("");
          }
          return;
        }
        if (inputRef.current) {
          inputRef.current.value = fallbackAddr;
        }
        setQuery(fallbackAddr);
        onChange?.(fallbackAddr);
        setTimeout(() => {
          const v = inputRef.current?.value?.trim() || fallbackAddr;
          if (v) locateAndSelect(v, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
        }, 150);
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isLoaded, onChange, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty]);

  const handleLocate = useCallback(() => {
    const currentValue = inputRef.current?.value?.trim() || query;
    if (currentValue) {
      locateAndSelect(currentValue, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty);
    }
  }, [query, properties, onPlaceSelect, onPropertySelect, onNavigateToProperty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange?.(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLocate();
  };

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="kalshi-border rounded-md bg-[var(--background)] px-4 py-3">
        <p className="text-sm text-[var(--foreground-muted)]">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for address search
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <p className="mb-2 px-2 text-base font-medium text-[var(--foreground)] sm:px-3">
        <span className="md:hidden">Find a property to view current purchase proposals or submit your own.</span>
        <span className="hidden md:inline">Find a property to view current purchase proposals or submit your own.</span>
      </p>
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            handleLocate();
          }
        }}
        className={`kalshi-border flex flex-wrap items-stretch gap-2 rounded-md bg-[var(--background)] px-3 py-2 transition-all duration-300 ease-out sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-3 ${
          focused
            ? "ring-2 ring-[#2C56A3]/50 border-[#2C56A3] shadow-[0_0_20px_rgba(44,86,163,0.15)]"
            : "hover:border-[var(--foreground-muted)]/50"
        }`}
      >
        <Search className="h-5 w-5 shrink-0 text-[var(--foreground-muted)] self-center hidden sm:block" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          onChange={handleChange}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            setFocused(true);
          }}
          onBlur={() => {
            blurTimeoutRef.current = setTimeout(() => {
              blurTimeoutRef.current = null;
              setFocused(false);
            }, 200);
          }}
          placeholder={effectivePlaceholder}
          className="min-h-[44px] flex-1 min-w-0 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
          aria-label="Search address"
          autoComplete="off"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="submit"
            className="min-h-[44px] flex flex-1 sm:flex-initial items-center justify-center gap-2 shrink-0 rounded-md bg-[#2C56A3] px-4 py-2.5 text-base font-medium text-white transition-colors hover:opacity-90"
            title="Locate on map"
          >
            <MapPin className="h-4 w-4" />
            Find
          </button>
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) {
                inputRef.current.value = "";
                setQuery("");
                onChange?.("");
              }
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 rounded-md border border-[var(--border)] bg-transparent px-3 py-2.5 text-base font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </form>
      <p className="mt-2 px-2 text-xs text-[var(--foreground-muted)] sm:px-3">
        Tip: For condos or apartments, include the unit (e.g. &quot;456 Ocean Blvd Apt 12&quot;).
      </p>
    </div>
  );
}
