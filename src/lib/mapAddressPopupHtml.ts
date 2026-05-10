const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function streetViewImageUrl(lat: number, lng: number): string {
  if (!GOOGLE_MAPS_KEY) return "";
  return `https://maps.googleapis.com/maps/api/streetview?size=320x180&location=${lat},${lng}&key=${GOOGLE_MAPS_KEY}`;
}

/** Info window markup for reverse-geocode map clicks — shared by home map & property aerial map. */
export function buildAddressOnlyPopupHTML(address: string, lat: number, lng: number): string {
  const streetViewUrl = streetViewImageUrl(lat, lng);
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
      ${streetViewUrl ? `
      <div style="width:100%;aspect-ratio:16/9;background:#0f172a;border-radius:6px;overflow:hidden;margin-bottom:12px">
        <img src="${streetViewUrl}" alt="Street View" style="width:100%;height:100%;object-fit:cover" />
      </div>
      ` : ""}
      <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8">Address</p>
      <p class="popup-address-text" style="margin:0 0 8px 0;font-weight:600;font-size:14px;color:#f1f5f9;line-height:1.4">${address.replace(/"/g, "&quot;")}</p>
      <button type="button" onclick="var p=this.previousElementSibling;navigator.clipboard.writeText(p.innerText).then(function(){this.textContent='Copied!'}.bind(this));setTimeout(function(){this.textContent='Copy address'}.bind(this),1500)" style="margin-bottom:12px;padding:4px 8px;font-size:11px;color:#94a3b8;background:transparent;border:1px solid #334155;border-radius:4px;cursor:pointer">Copy address</button>
      <div style="display:flex;flex-direction:column;gap:8px">
        <a href="/place?address=${encodeURIComponent(address)}&lat=${lat}&lng=${lng}#make-proposal" onclick="event.preventDefault();event.stopPropagation();window.location.href=this.getAttribute('href');return false" style="display:block;text-align:center;padding:10px 16px;background:#10b981;color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;cursor:pointer">Make Proposal</a>
        <a href="/place?address=${encodeURIComponent(address)}&lat=${lat}&lng=${lng}" onclick="event.preventDefault();event.stopPropagation();window.location.href=this.getAttribute('href');return false" style="display:block;text-align:center;padding:10px 16px;background:#3b82f6;color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;cursor:pointer">View Proposals</a>
      </div>
    </div>
  `;
}
