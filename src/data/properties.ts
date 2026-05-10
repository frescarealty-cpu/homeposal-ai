/**
 * Shared property data — replace with Supabase/API fetch later.
 * When you add a property API (e.g. Reonomy, CoreLogic, Zillow, etc.),
 * swap this for a fetch function that returns the same shape.
 */
export type PropertyListing = {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSizeSqft: number | null;
  yearBuilt: number;
  propertyType: string;
  description: string;
  imageUrls: string[];
  amenities: string[];
  status: "open" | "pending" | "closed";
  listPriceCents: number;
  offerDeadline: string;
  bestOfferCents: number;
  pendingOfferCount: number;
};

export const MOCK_PROPERTIES: PropertyListing[] = [
  {
    id: "1",
    address: "123 Oak Street",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90012",
    latitude: 34.0522,
    longitude: -118.2437,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 2200,
    lotSizeSqft: 7500,
    yearBuilt: 2015,
    propertyType: "Single Family",
    description: "Beautiful 3-bedroom home with modern finishes. Open floor plan, chef's kitchen, and private backyard.",
    imageUrls: [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    ],
    amenities: ["pool", "garage", "hardwood floors"],
    status: "open",
    listPriceCents: 60000000,
    offerDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    bestOfferCents: 57500000,
    pendingOfferCount: 3,
  },
  {
    id: "2",
    address: "456 Maple Ave",
    city: "San Diego",
    state: "CA",
    zipCode: "92101",
    latitude: 32.7157,
    longitude: -117.1611,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2800,
    lotSizeSqft: 10000,
    yearBuilt: 2018,
    propertyType: "Single Family",
    description: "Spacious 4-bedroom with pool and large lot. Perfect for families.",
    imageUrls: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    ],
    amenities: ["pool", "garage", "outdoor kitchen"],
    status: "open",
    listPriceCents: 65000000,
    offerDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    bestOfferCents: 61200000,
    pendingOfferCount: 5,
  },
  {
    id: "3",
    address: "789 Pine Road",
    city: "Irvine",
    state: "CA",
    zipCode: "92618",
    latitude: 33.6846,
    longitude: -117.8265,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    lotSizeSqft: null,
    yearBuilt: 2010,
    propertyType: "Condo",
    description: "Updated condo in prime location.",
    imageUrls: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    ],
    amenities: ["pool", "gym"],
    status: "closed",
    listPriceCents: 45000000,
    offerDeadline: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    bestOfferCents: 0,
    pendingOfferCount: 0,
  },
];
