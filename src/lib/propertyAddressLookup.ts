import type { PropertyListing } from "@/data/properties";

export const SOCAL_BOUNDS = {
  north: 35.5,
  south: 32.5,
  east: -115.0,
  west: -120.5,
};

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
        bounds: new google.maps.LatLngBounds(
          new google.maps.LatLng(SOCAL_BOUNDS.south, SOCAL_BOUNDS.west),
          new google.maps.LatLng(SOCAL_BOUNDS.north, SOCAL_BOUNDS.east)
        ),
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
        if (
          lat < SOCAL_BOUNDS.south ||
          lat > SOCAL_BOUNDS.north ||
          lng < SOCAL_BOUNDS.west ||
          lng > SOCAL_BOUNDS.east
        ) {
          resolve(null);
          return;
        }
        resolve({ address: formatted, lat, lng });
      }
    );
  });
}
