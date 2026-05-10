import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Send email notification when a new proposal is submitted.
 * Recipients: PROPOSAL_NOTIFICATION_EMAIL or ADMIN_EMAILS (comma-separated).
 * Required in Vercel/deployment: RESEND_API_KEY and at least one of
 * PROPOSAL_NOTIFICATION_EMAIL, ADMIN_EMAILS. No-op if either is missing.
 */
export async function sendProposalNotification(params: {
  offerAmountCents: number;
  financingType: string;
  closingDate: string;
  target: "property" | "place";
  propertyId?: string;
  placeAddress?: string;
  adminUrl?: string;
  notificationType?: "submitted" | "edited";
}): Promise<void> {
  const emailsRaw =
    process.env.PROPOSAL_NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAILS ?? "";
  const emails = emailsRaw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  const resend = getResend();
  if (emails.length === 0 || !resend) {
    if (emails.length === 0) {
      console.warn(
        "[HomePosal] Admin proposal notification skipped: set PROPOSAL_NOTIFICATION_EMAIL or ADMIN_EMAILS (and RESEND_API_KEY) in Vercel Environment Variables."
      );
    }
    return;
  }

  const {
    offerAmountCents,
    financingType,
    closingDate,
    target,
    propertyId,
    placeAddress,
    adminUrl,
    notificationType = "submitted",
  } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const adminLink = adminUrl ?? `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/admin`;
  const targetDesc =
    target === "property"
      ? `property ${propertyId ?? "N/A"}`
      : `address: ${placeAddress ?? "N/A"}`;
  const isEdited = notificationType === "edited";
  const heading = isEdited ? "Proposal edited and pending re-approval" : "New proposal submitted";
  const intro = isEdited
    ? "An existing proposal was edited by the user and has been set back to pending review."
    : "A new offer has been submitted on HomePosal.";
  const subjectPrefix = isEdited ? "Edited proposal pending approval" : "New proposal received";

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "HomePosal <onboarding@resend.dev>",
      to: emails,
      subject: `${subjectPrefix} – ${formatCurrency(offerAmountCents)} on ${target === "place" ? placeAddress ?? "address" : "property"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>${heading}</h2>
          <p>${intro}</p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Amount:</strong> ${formatCurrency(offerAmountCents)}</li>
            <li><strong>Financing:</strong> ${financingType}</li>
            <li><strong>Closing date:</strong> ${closingDate}</li>
            <li><strong>Target:</strong> ${targetDesc}</li>
          </ul>
          <p style="margin: 24px 0;">
            <a href="${adminLink}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View & approve in Admin</a>
          </p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Proposal notification email error:", e);
  }
}
