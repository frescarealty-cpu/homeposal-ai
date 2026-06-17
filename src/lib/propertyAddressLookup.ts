import type { PropertyListing } from "@/data/properties";

export const SOCAL_BOUNDS = {
  north: 35.5,
  south: 32.5,
  east: -115.0,
  west: -120.5,
};

/** Southern California: Imperial, San Diego, Orange, LA, Riverside, San Bernardino, Ventura, Santa Barbara, Kern. */
const NON_CA_STATE_IN_ADDRESS =
  /,\s*(AL|AK|AZ|AR|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i;

export function isWithinSoCalBounds(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= SOCAL_BOUNDS.south &&
    lat <= SOCAL_BOUNDS.north &&
    lng >= SOCAL_BOUNDS.west &&
    lng <= SOCAL_BOUNDS.east
  );
}

export function createSoCalLatLngBounds(): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
    new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
  );
}

/** Fast pre-filter: keep California-formatted autocomplete lines, drop other US states. */
export function isCaliforniaAddressDescription(description: string): boolean {
  const d = description.trim();
  if (!d) return false;
  if (NON_CA_STATE_IN_ADDRESS.test(d)) return false;
  return /,\s*CA\b/i.test(d) || /\bCalifornia\b/i.test(d);
}

export function verifyPlaceIdInSoCal(placeId: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!placeId || typeof window === "undefined" || !window.google?.maps) {
      resolve(false);
      return;
    }
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(false);
        return;
      }
      const loc = results[0].geometry.location;
      resolve(isWithinSoCalBounds(loc.lat(), loc.lng()));
    });
  });
}

/** Verify predictions fall inside SoCal bounds (AutocompleteService bounds are bias-only). */
export async function filterPredictionsToSoCal<T extends { place_id: string; description: string }>(
  predictions: T[]
): Promise<T[]> {
  const caOnly = predictions.filter((p) => isCaliforniaAddressDescription(p.description));
  if (caOnly.length === 0) return [];

  const checks = await Promise.all(
    caOnly.slice(0, 6).map(async (p) => ({
      prediction: p,
      ok: await verifyPlaceIdInSoCal(p.place_id),
    }))
  );
  return checks.filter((c) => c.ok).map((c) => c.prediction);
}

export function getSoCalAutocompleteOptions(
  fields: string[]
): google.maps.places.AutocompleteOptions {
  return {
    bounds: createSoCalLatLngBounds(),
    strictBounds: true,
    componentRestrictions: { country: "us" },
    types: ["address"],
    fields,
  };
}

export function getSoCalPredictionRequest(
  input: string,
  types: string[]
): google.maps.places.AutocompletionRequest {
  return {
    input,
    bounds: createSoCalLatLngBounds(),
    componentRestrictions: { country: "us" },
    location: new google.maps.LatLng(34.05, -118.25),
    radius: 400_000,
    types,
  };
}

export function findPropertyByLocation(
  properties: PropertyListing[],
  lat: number,
  lng: number
): PropertyListing | null {
  const threshold = 0.01;
  let best: { p: PropertyListing; d: number } | null = null;
  for (const p of properties) {
    const d = Math.sqrt((p.latitude - lat) ** 2 + (p.longitude - lng) ** 2);
    if (d < threshold && (!best || d < best.d)) best = { p, d };
  }
  return best?.p ?? null;
}

export function findPropertyByAddress(
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
    const nFull = normalized(full);
    if (nFull === a || nFull.includes(a) || a.includes(normalized(p.address))) {
      return p;
    }
  }
  return null;
}

export function resolvePropertyOrPlacePath(
  properties: PropertyListing[],
  address: string,
  lat: number,
  lng: number
): string {
  const match =
    findPropertyByLocation(properties, lat, lng) ?? findPropertyByAddress(properties, address);
  if (match) return `/property/${match.id}`;

  const qs = new URLSearchParams({
    address,
    lat: String(lat),
    lng: String(lng),
  });
  return `/place?${qs.toString()}`;
}

export function geocodeSoCalAddress(
  address: string
): Promise<{ address: string; lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!address.trim() || !window.google?.maps) {
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address: address.trim(),
        bounds: createSoCalLatLngBounds(),
      },
      (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          resolve(null);
          return;
        }
        const loc = results[0].geometry?.location;
        const formatted = results[0].formatted_address;
        if (!loc || !formatted) {
          resolve(null);
          return;
        }
        const lat = loc.lat();
        const lng = loc.lng();
        if (!isWithinSoCalBounds(lat, lng)) {
          resolve(null);
          return;
        }
        resolve({ address: formatted, lat, lng });
      }
    );
  });
}
