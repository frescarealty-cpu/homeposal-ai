"use client";

import type { PropertyListing } from "@/data/properties";
import { buildPropertyPopupHTML } from "@/lib/propertyPopupHtml";

type PropertySelectedPanelProps = {
  property: PropertyListing;
};

/** Renders the exact same content as the map popup using the shared HTML builder */
export function PropertySelectedPanel({ property }: PropertySelectedPanelProps) {
  const html = buildPropertyPopupHTML(property);
  return (
    <div
      className="property-popup-panel"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
