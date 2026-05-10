import { NextRequest, NextResponse } from "next/server";

const ADDRESS_VALIDATION_KEY = process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY;

type AddressValidateRequest = {
  address: string;
  regionCode?: string;
};

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!ADDRESS_VALIDATION_KEY) {
    return NextResponse.json(
      { ok: false, code: "not-configured", error: "Address validation is not configured." },
      { status: 500 }
    );
  }

  let body: AddressValidateRequest | null = null;
  try {
    body = (await req.json()) as AddressValidateRequest;
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad-request", error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!body?.address || typeof body.address !== "string") {
    return NextResponse.json(
      { ok: false, code: "bad-request", error: "Address is required." },
      { status: 400 }
    );
  }

  const regionCode = body.regionCode || "US";

  const payload = {
    address: {
      addressLines: [body.address],
      regionCode,
    },
  };

  let apiRes: Response;
  try {
    apiRes = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${ADDRESS_VALIDATION_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
  } catch (e) {
    console.error("[AddressValidation] Network error:", e);
    return NextResponse.json(
      {
        ok: false,
        code: "network-error",
        error: "Unable to reach address validation service. Please try again.",
      },
      { status: 502 }
    );
  }

  if (!apiRes.ok) {
    const text = await apiRes.text().catch(() => "");
    console.error("[AddressValidation] API error:", apiRes.status, text);
    return NextResponse.json(
      {
        ok: false,
        code: "upstream-error",
        error: "Address validation failed. Please check the address and try again.",
      },
      { status: 502 }
    );
  }

  const data = (await apiRes.json()) as any;
  const result = data?.result ?? {};
  const verdict = result.verdict ?? {};
  const address = result.address ?? {};
  const geocode = result.geocode ?? {};

  const possibleNextAction = verdict.possibleNextAction as string | undefined;

  const components: any[] = Array.isArray(address.addressComponents)
    ? address.addressComponents
    : [];

  const postal = address.postalAddress ?? {};
  const subpremiseComponent = components.find(
    (c) =>
      typeof c?.componentType === "string" &&
      (c.componentType === "subpremise" ||
        c.componentType === "sub_premise" ||
        c.componentType === "subpremise_number")
  );

  const unitText: string | null =
    subpremiseComponent?.componentName?.text ??
    postal.subpremise ??
    null;

  const hasUnit = !!unitText;

  if (!hasUnit && possibleNextAction === "CONFIRM_ADD_SUBPREMISES") {
    return NextResponse.json(
      {
        ok: false,
        code: "unit-required",
        error:
          "This building appears to require a unit or apartment number. Please include the unit in the address before submitting.",
      },
      { status: 200 }
    );
  }

  const location = geocode.location ?? {};
  const lat = typeof location.latitude === "number" ? location.latitude : null;
  const lng = typeof location.longitude === "number" ? location.longitude : null;

  const formattedAddress: string =
    typeof address.formattedAddress === "string"
      ? address.formattedAddress
      : body.address;

  // Generic mapping shape suitable for a Supabase `properties` table.
  const supabasePropertyPayload = {
    address_line_1: Array.isArray(postal.addressLines)
      ? postal.addressLines[0] ?? null
      : null,
    address_line_2: Array.isArray(postal.addressLines)
      ? postal.addressLines[1] ?? null
      : null,
    locality: postal.locality ?? null,
    administrative_area: postal.administrativeArea ?? null,
    postal_code: postal.postalCode ?? null,
    country_code: postal.regionCode ?? null,
    latitude: lat,
    longitude: lng,
    unit: unitText,
    formatted_address: formattedAddress,
  };

  return NextResponse.json(
    {
      ok: true,
      formattedAddress,
      lat,
      lng,
      unit: unitText,
      supabasePropertyPayload,
    },
    { status: 200 }
  );
}

