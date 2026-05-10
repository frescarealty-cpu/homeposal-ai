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

const fromEmail = () =>
  process.env.RESEND_FROM_EMAIL ?? "HomePosal <onboarding@resend.dev>";

const baseUrl = () => {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  return url.startsWith("http") ? url : `https://${url}`;
};

/**
 * Email to user when their proposal has been submitted and is under review.
 */
export async function sendProposalSubmittedEmail(params: {
  to: string;
  fullName?: string | null;
  offerAmountCents: number;
  target: "property" | "place";
  propertyId?: string;
  placeAddress?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.to?.trim()) return;
  const { to, fullName, offerAmountCents, target, propertyId, placeAddress } = params;
  const targetDesc =
    target === "property"
      ? `property ${propertyId ?? "N/A"}`
      : placeAddress ?? "your selected address";
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi,";
  try {
    await resend.emails.send({
      from: fromEmail(),
      to: to.trim(),
      subject: "Your HomePosal proposal has been submitted",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Proposal submitted</h2>
          <p>${greeting}</p>
          <p>Your proposal has been received and is under review.</p>
          <p><strong>Amount:</strong> ${formatCurrency(offerAmountCents)}</p>
          <p><strong>Target:</strong> ${targetDesc}</p>
          <p>We will reach out via your preferred contact method to verify your proof of funds and pre-qualification letters prior to authorizing this proposal for public display. Thank you for helping us maintain a marketplace of verified, serious interest.</p>
          <p style="margin: 24px 0;">
            <a href="${baseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View my proposals</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">— The HomePosal team</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Proposal submitted email error:", e);
  }
}

/**
 * Email to user when their proposal has been approved and is now posted on HomePosal.
 */
export async function sendProposalApprovedEmail(params: {
  to: string;
  fullName?: string | null;
  offerAmountCents: number;
  target: "property" | "place";
  propertyId?: string;
  placeAddress?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.to?.trim()) return;
  const { to, fullName, offerAmountCents, target, propertyId, placeAddress } = params;
  const targetDesc =
    target === "property"
      ? `property ${propertyId ?? "N/A"}`
      : placeAddress ?? "your selected address";
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi,";
  const viewUrl =
    target === "property" && propertyId
      ? `${baseUrl()}/property/${propertyId}`
      : `${baseUrl()}/dashboard`;
  try {
    await resend.emails.send({
      from: fromEmail(),
      to: to.trim(),
      subject: "Your proposal is now live on HomePosal",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Proposal now posted</h2>
          <p>${greeting}</p>
          <p>Your proposal has been verified and is now posted on HomePosal.</p>
          <p><strong>Amount:</strong> ${formatCurrency(offerAmountCents)}</p>
          <p><strong>Target:</strong> ${targetDesc}</p>
          <p style="margin: 24px 0;">
            <a href="${viewUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View on HomePosal</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">— The HomePosal team</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Proposal approved email error:", e);
  }
}

/**
 * Email to user when they have edited their proposal.
 */
export async function sendProposalEditedEmail(params: {
  to: string;
  fullName?: string | null;
  offerAmountCents: number;
  target: "property" | "place";
  propertyId?: string;
  placeAddress?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.to?.trim()) return;
  const { to, fullName, offerAmountCents, target, propertyId, placeAddress } = params;
  const targetDesc =
    target === "property"
      ? `property ${propertyId ?? "N/A"}`
      : placeAddress ?? "your selected address";
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi,";
  try {
    await resend.emails.send({
      from: fromEmail(),
      to: to.trim(),
      subject: "Your HomePosal proposal was updated",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Proposal updated</h2>
          <p>${greeting}</p>
          <p>Your proposal has been updated successfully.</p>
          <p><strong>Amount:</strong> ${formatCurrency(offerAmountCents)}</p>
          <p><strong>Target:</strong> ${targetDesc}</p>
          <p>If your proposal was already approved, it may need to be re-verified before it appears again on the board.</p>
          <p style="margin: 24px 0;">
            <a href="${baseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">View my proposals</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">— The HomePosal team</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Proposal edited email error:", e);
  }
}

/**
 * Email to user when they have withdrawn/cancelled their proposal.
 */
export async function sendProposalWithdrawnByUserEmail(params: {
  to: string;
  fullName?: string | null;
  offerAmountCents: number;
  target: "property" | "place";
  propertyId?: string;
  placeAddress?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.to?.trim()) return;
  const { to, fullName, offerAmountCents, target, propertyId, placeAddress } = params;
  const targetDesc =
    target === "property"
      ? `property ${propertyId ?? "N/A"}`
      : placeAddress ?? "your selected address";
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi,";
  try {
    await resend.emails.send({
      from: fromEmail(),
      to: to.trim(),
      subject: "Your HomePosal proposal has been withdrawn",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Proposal withdrawn</h2>
          <p>${greeting}</p>
          <p>Your proposal has been withdrawn as requested.</p>
          <p><strong>Amount:</strong> ${formatCurrency(offerAmountCents)}</p>
          <p><strong>Target:</strong> ${targetDesc}</p>
          <p>You can submit a new proposal at any time from your dashboard or from any property page.</p>
          <p style="margin: 24px 0;">
            <a href="${baseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to dashboard</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">— The HomePosal team</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Proposal withdrawn email error:", e);
  }
}

/**
 * Email to user when their proposal has been cancelled (e.g. by admin or system).
 */
export async function sendProposalCancelledEmail(params: {
  to: string;
  fullName?: string | null;
  offerAmountCents: number;
  target: "property" | "place";
  propertyId?: string;
  placeAddress?: string;
  reason?: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend || !params.to?.trim()) return;
  const { to, fullName, offerAmountCents, target, propertyId, placeAddress, reason } = params;
  const targetDesc =
    target === "property"
      ? `property ${propertyId ?? "N/A"}`
      : placeAddress ?? "your selected address";
  const greeting = fullName?.trim() ? `Hi ${fullName.trim()},` : "Hi,";
  try {
    await resend.emails.send({
      from: fromEmail(),
      to: to.trim(),
      subject: "Your HomePosal proposal has been cancelled",
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Proposal cancelled</h2>
          <p>${greeting}</p>
          <p>Your proposal has been cancelled and is no longer visible on HomePosal.</p>
          <p><strong>Amount:</strong> ${formatCurrency(offerAmountCents)}</p>
          <p><strong>Target:</strong> ${targetDesc}</p>
          ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ""}
          <p>If you have questions or wish to submit a new proposal, you can do so from your dashboard.</p>
          <p style="margin: 24px 0;">
            <a href="${baseUrl()}/dashboard" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to dashboard</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">— The HomePosal team</p>
        </div>
      `,
    });
  } catch (e) {
    console.error("Proposal cancelled email error:", e);
  }
}
