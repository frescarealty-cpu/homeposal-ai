import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const DEFAULT_MESSAGE =
  "Interested in this offer? A HomePosal representative will help you verify the details and next steps.";

function getEmails(): string[] {
  const raw = process.env.PROPOSAL_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const resend = getResend();
  const emails = getEmails();

  if (!resend || emails.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Inquiry service is not configured." },
      { status: 500 }
    );
  }

  let body: {
    proposalId: string;
    inquiryAddressLabel?: string;
    name?: string;
    email?: string;
    phone?: string;
    preferredContactMethod?: "email" | "text" | "phone";
    isOwner?: boolean;
    message?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const proposalId = body?.proposalId;
  const inquiryAddressLabel = body?.inquiryAddressLabel ?? "this property";
  const preferredContactMethod = body?.preferredContactMethod ?? "email";
  const message = body?.message ?? DEFAULT_MESSAGE;
  const name = (body?.name ?? "").trim();
  const isOwner = body?.isOwner === true;

  const emailFromBody = (body?.email ?? "").trim();
  const phone = (body?.phone ?? "").trim();

  const escapeHtml = (v: unknown) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const formatCurrencyFromCents = (cents: unknown) => {
    if (cents == null) return "(unknown)";
    const n = typeof cents === "number" ? cents : Number(cents);
    if (!Number.isFinite(n)) return "(unknown)";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(n / 100);
  };

  const validMethods: Array<"email" | "text" | "phone"> = ["email", "text", "phone"];
  if (!proposalId || typeof proposalId !== "string") {
    return NextResponse.json({ ok: false, error: "proposalId is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "name is required." }, { status: 400 });
  }
  if (!isOwner) {
    return NextResponse.json(
      { ok: false, error: "Owner confirmation is required." },
      { status: 400 }
    );
  }
  if (!validMethods.includes(preferredContactMethod)) {
    return NextResponse.json({ ok: false, error: "Invalid preferredContactMethod." }, { status: 400 });
  }

  if ((preferredContactMethod === "phone" || preferredContactMethod === "text") && !phone) {
    return NextResponse.json({ ok: false, error: "phone is required for phone/text contact." }, { status: 400 });
  }

  // We intentionally do NOT require the user to be logged in.
  // Logged-in users may still prefill `email`, but guests can submit the form too.
  let supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch {
    supabase = await createClient();
  }

  const contactEmail = emailFromBody;
  if (!contactEmail) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  // Fetch proposal details by ID (property or place) so the inquiry email includes the full context.
  const [propRow] = await Promise.all([
    (async () => {
      const { data, error } = await supabase
        .from("proposals")
        .select(
          "id, user_id, property_id, offer_amount_cents, financing_type, closing_date, desired_days_to_close, accepted_terms_at, status, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, preferred_contact_method, created_at"
        )
        .eq("id", proposalId)
        .limit(1);
      if (error) return null;
      return Array.isArray(data) ? data[0] ?? null : null;
    })(),
  ]);

  const [placeRow] = await Promise.all([
    (async () => {
      const { data, error } = await supabase
        .from("place_proposals")
        .select(
          "id, user_id, place_address, place_lat, place_lng, offer_amount_cents, financing_type, closing_date, desired_days_to_close, accepted_terms_at, status, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, preferred_contact_method, created_at"
        )
        .eq("id", proposalId)
        .limit(1);
      if (error) return null;
      return Array.isArray(data) ? data[0] ?? null : null;
    })(),
  ]);

  const proposalKind = propRow ? "property" : placeRow ? "place" : "unknown";
  const offerAmountCents = propRow?.offer_amount_cents ?? placeRow?.offer_amount_cents ?? null;
  const financingType = propRow?.financing_type ?? placeRow?.financing_type ?? null;
  const closingDate = propRow?.closing_date ?? placeRow?.closing_date ?? null;
  const desiredDaysToClose = propRow?.desired_days_to_close ?? placeRow?.desired_days_to_close ?? null;
  const createdAt = propRow?.created_at ?? placeRow?.created_at ?? null;
  const fullNotes = propRow?.full_notes ?? placeRow?.full_notes ?? null;
  const proofOfFunds = propRow?.proof_of_funds ?? placeRow?.proof_of_funds ?? null;
  const prequalLetter = propRow?.prequal_letter ?? placeRow?.prequal_letter ?? null;
  const preferredContact = propRow?.preferred_contact_method ?? placeRow?.preferred_contact_method ?? null;
  const bidderNotes =
    fullNotes != null ? String(fullNotes).slice(0, 2000) : null;
  const bidderUserId = propRow?.user_id ?? placeRow?.user_id ?? null;

  const [bidderProfile] = await Promise.all([
    (async () => {
      if (!bidderUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", bidderUserId)
        .single();
      if (error) return null;
      return data ?? null;
    })(),
  ]);

  const bidderFullName = bidderProfile?.full_name ?? null;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "HomePosal <onboarding@resend.dev>",
      to: emails,
      subject: `Inquiry: Proposal ${proposalId} – ${inquiryAddressLabel}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="margin:0 0 12px 0;">Proposal inquiry request</h2>
          <p style="margin:0 0 16px 0;color:#334155;">
            ${escapeHtml(inquiryAddressLabel)}
          </p>
          <ul style="margin:0;padding-left:18px;color:#111827;line-height:1.6;">
            <li><strong>Proposal ID:</strong> ${escapeHtml(proposalId)}</li>
            <li><strong>Proposal Type:</strong> ${escapeHtml(proposalKind)}</li>
            <li><strong>Offeror Name:</strong> ${bidderFullName ? escapeHtml(bidderFullName) : "(unknown)"}</li>
            <li><strong>Offer Amount:</strong> ${formatCurrencyFromCents(offerAmountCents)}</li>
            <li><strong>Financing:</strong> ${escapeHtml(financingType ?? "(unknown)")}</li>
            <li><strong>Closing Date:</strong> ${escapeHtml(closingDate ?? "(unknown)")}</li>
            <li><strong>Desired Days to Close:</strong> ${desiredDaysToClose != null ? escapeHtml(String(desiredDaysToClose)) : "(unknown)"}</li>
            <li><strong>Submitted At:</strong> ${createdAt ? escapeHtml(String(createdAt)) : "(unknown)"}</li>
            <li><strong>Proof of Funds:</strong> ${proofOfFunds == null ? "(unknown)" : proofOfFunds ? "Yes" : "No"}</li>
            <li><strong>Pre-qual Letter:</strong> ${prequalLetter == null ? "(unknown)" : prequalLetter ? "Yes" : "No"}</li>
            <li><strong>Bidder Notes:</strong> ${
              bidderNotes ? escapeHtml(bidderNotes) : "(none)"
            }</li>
            <li><strong>Bidder Preferred Contact:</strong> ${escapeHtml(preferredContact ?? "(unknown)")}</li>

            <li><strong>Your Name:</strong> ${escapeHtml(name)}</li>
            <li><strong>Your Email:</strong> ${escapeHtml(contactEmail)}</li>
            <li><strong>Your Preferred Contact Method:</strong> ${escapeHtml(preferredContactMethod)}</li>
            <li><strong>Confirmed owner:</strong> Yes</li>
            ${
              phone
                ? `<li><strong>Your Phone:</strong> ${escapeHtml(phone)}</li>`
                : `<li><strong>Your Phone:</strong> (not provided)</li>`
            }
            <li><strong>Message:</strong> ${escapeHtml(message)}</li>
          </ul>
          <p style="margin-top:18px;color:#334155;font-size:12px;">
            Sent from HomePosal “Discuss this Proposal” drawer.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[HomePosal] inquiry email failed:", e);
    return NextResponse.json({ ok: false, error: "Failed to submit inquiry." }, { status: 500 });
  }
}

