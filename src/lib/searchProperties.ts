import type { PropertyListing } from "@/data/properties";

/**
 * Parses natural language search and filters properties.
 * Examples: "3 bed in San Diego", "under $600k", "condo with pool"
 */
export function filterPropertiesByQuery(
  query: string,
  properties: PropertyListing[]
): PropertyListing[] {
  const q = query.trim().toLowerCase();
  if (!q) return properties;

  return properties.filter((p) => {
    // Bedrooms: "3 bed", "3-bedroom", "3 bedrooms"
    const bedMatch = q.match(/(\d+)\s*[-]?\s*bed(?:room)?s?/);
    if (bedMatch) {
      const minBeds = parseInt(bedMatch[1], 10);
      if (p.bedrooms < minBeds) return false;
    }

    // Max price: "under $600k", "under 600k", "under 650000"
    const priceMatch = q.match(/(?:under|less than|below|max)\s*\$?(\d+)(k|000)?/);
    if (priceMatch) {
      let maxDollars = parseInt(priceMatch[1], 10);
      if (priceMatch[2] === "k") maxDollars *= 1000;
      const maxCents = maxDollars * 100;
      if (p.listPriceCents > maxCents) return false;
    }

    // Location: "San Diego", "Los Angeles", "LA", "Irvine"
    if (q.includes("san diego") && !p.city.toLowerCase().includes("san diego")) return false;
    if (q.includes("los angeles") && !p.city.toLowerCase().includes("los angeles")) return false;
    if (q.includes("irvine") && !p.city.toLowerCase().includes("irvine")) return false;
    if ((q.includes(" la ") || q === "la" || q.startsWith("la ")) && !p.city.toLowerCase().includes("los angeles"))
      return false;

    // Amenities
    if (q.includes("pool") && !p.amenities.some((a) => a.toLowerCase().includes("pool")))
      return false;
    if (q.includes("garage") && !p.amenities.some((a) => a.toLowerCase().includes("garage")))
      return false;
    if (q.includes("gym") && !p.amenities.some((a) => a.toLowerCase().includes("gym")))
      return false;

    // Property type
    if (q.includes("condo") && !p.propertyType.toLowerCase().includes("condo")) return false;
    if (
      (q.includes("house") || q.includes("single family")) &&
      !p.propertyType.toLowerCase().includes("single")
    )
      return false;

    // Min sqft: "2000 sqft", "over 2000 sqft"
    const sqftMatch = q.match(/(?:over|min|at least)\s*(\d+)\s*(?:sqft|sq)?/);
    if (sqftMatch) {
      const minSqft = parseInt(sqftMatch[1], 10);
      if (p.squareFeet < minSqft) return false;
    }

    // General text search - any meaningful word matches
    const stopwords = new Set(["find", "a", "the", "in", "with", "for", "and", "or", "looking"]);
    const words = q
      .replace(/(\d+)\s*[-]?\s*bed(?:room)?s?/g, "")
      .replace(/(?:under|less than|below|max)\s*\$?\d+k?/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopwords.has(w));

    if (words.length > 0) {
      const searchableText = [
        p.address,
        p.city,
        p.state,
        p.description,
        ...p.amenities,
        p.propertyType,
      ]
        .join(" ")
        .toLowerCase();

      const anyWordMatches = words.some((w) => searchableText.includes(w));
      if (!anyWordMatches && !bedMatch && !priceMatch) return false;
    }

    return true;
  });
}
