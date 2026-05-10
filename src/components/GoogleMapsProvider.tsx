"use client";

import { createContext, useContext } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/** Stable array reference so LoadScript does not reload on every render */
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

type GoogleMapsContextValue = {
  isLoaded: boolean;
  loadError: Error | undefined;
};

const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null);

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const ctx = useContext(GoogleMapsContext);
  return ctx ?? { isLoaded: false, loadError: undefined };
}
