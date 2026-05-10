export type County = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
};

export const SOCAL_COUNTIES: County[] = [
  { slug: "san-diego", name: "San Diego", lat: 32.7157, lng: -117.1611, zoom: 9 },
  { slug: "orange", name: "Orange", lat: 33.7175, lng: -117.8311, zoom: 10 },
  { slug: "los-angeles", name: "Los Angeles", lat: 34.0522, lng: -118.2437, zoom: 9 },
  { slug: "riverside", name: "Riverside", lat: 33.9533, lng: -117.3962, zoom: 9 },
  { slug: "san-bernardino", name: "San Bernardino", lat: 34.1083, lng: -117.2898, zoom: 9 },
  { slug: "ventura", name: "Ventura", lat: 34.2746, lng: -119.2290, zoom: 9 },
  { slug: "santa-barbara", name: "Santa Barbara", lat: 34.4208, lng: -119.6982, zoom: 9 },
  { slug: "imperial", name: "Imperial", lat: 32.8340, lng: -115.5697, zoom: 9 },
  { slug: "kern", name: "Kern", lat: 35.3733, lng: -118.9569, zoom: 9 },
];
