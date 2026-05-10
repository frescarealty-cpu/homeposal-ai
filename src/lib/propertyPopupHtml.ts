import type { PropertyListing } from "@/data/properties";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function streetViewImageUrl(lat: number, lng: number): string {
  if (!GOOGLE_MAPS_KEY) return "";
  return `https://maps.googleapis.com/maps/api/streetview?size=320x180&location=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
}

function aerialImageUrl(lat: number, lng: number): string {
  if (!GOOGLE_MAPS_KEY) return "";
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=320x180&scale=2&maptype=satellite&key=${GOOGLE_MAPS_KEY}`;
}

/** Builds the exact popup HTML used by both map info window and right panel */
export function buildPropertyPopupHTML(property: PropertyListing): string {
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zipCode}`.trim();
  const streetViewUrl = streetViewImageUrl(property.latitude, property.longitude);
  const fallbackImg = property.imageUrls[0] || "";
  const aerialUrl = aerialImageUrl(property.latitude, property.longitude);
  const primaryImg = streetViewUrl || aerialUrl || property.imageUrls[0] || "";
  const lotText = property.lotSizeSqft
    ? ` • Lot ${property.lotSizeSqft.toLocaleString()} sqft`
    : "";

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
      <div style="
        width: 100%;
        aspect-ratio: 16/9;
        background: #0f172a;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 12px;
      ">
        <img src="${primaryImg}" alt="Street or aerial view" style="
          width: 100%;
          height: 100%;
          object-fit: cover;
        " onerror="var img=this; if (img.src.indexOf('streetview') !== -1 && '${aerialUrl}') { img.src='${aerialUrl}'; } else if (img.src.indexOf('staticmap') !== -1 && '${fallbackImg}') { img.src='${fallbackImg}'; }" />
      </div>
      <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8;">Address</p>
      <p class="popup-address-text" style="
        margin: 0 0 8px 0;
        font-weight: 600;
        font-size: 14px;
        color: #f1f5f9;
        line-height: 1.4;
      ">${fullAddress.replace(/"/g, "&quot;")}</p>
      <button type="button" onclick="var p=this.previousElementSibling;navigator.clipboard.writeText(p.innerText).then(function(){this.textContent='Copied!'}.bind(this));setTimeout(function(){this.textContent='Copy address'}.bind(this),1500)" style="
        margin-bottom: 8px;
        padding: 4px 8px;
        font-size: 11px;
        color: #94a3b8;
        background: transparent;
        border: 1px solid #334155;
        border-radius: 4px;
        cursor: pointer;
      ">Copy address</button>
      <p style="
        margin: 0 0 12px 0;
        font-size: 12px;
        color: #94a3b8;
      ">
        ${property.bedrooms} bed • ${property.bathrooms} bath • ${property.squareFeet.toLocaleString()} sqft${lotText}
      </p>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #334155;display:flex;flex-direction:column;gap:8px">
        <a href="/property/${property.id}#make-proposal" style="display:block;width:100%;text-align:center;padding:10px 16px;background:#10b981;color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;cursor:pointer;box-sizing:border-box">Make Proposal</a>
        <a href="/property/${property.id}" style="display:block;width:100%;text-align:center;padding:10px 16px;background:#3b82f6;color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;cursor:pointer;box-sizing:border-box">View Proposals</a>
      </div>
    </div>
  `;
}
