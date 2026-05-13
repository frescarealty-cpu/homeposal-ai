"use server";

import { Resend } from "resend";

const CONTACT_TO = "frescarealty@gmail.com";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export type SendContactResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function sendContactForm(params: {
  name: string;
  email: string;
  phone?: string;
  preferredContactMethod?: "email" | "text" | "phone";
  message: string;
  honeypot?: string;
}): Promise<SendContactResult> {
  const name = params.name?.trim() ?? "";
  const email = params.email?.trim() ?? "";
  const phone = params.phone?.trim() ?? "";
  const preferredContactMethod = params.preferredContactMethod ?? "email";
  const message = params.message?.trim() ?? "";
  const honeypot = params.honeypot?.trim() ?? "";

  if (honeypot) return { success: false, error: "Something went wrong. Please try again." };
  if (!name) return { success: false, error: "Please enter your name." };
  if (!email) return { success: false, error: "Please enter your email." };
  if ((preferredContactMethod === "phone" || preferredContactMethod === "text") && !phone) {
    return { success: false, error: "Please enter your phone number (or choose Email)." };
  }
  if (!message) return { success: false, error: "Please enter a message." };

  const resend = getResend();
  if (!resend) {
    console.warn("[Contact] RESEND_API_KEY not set; contact form not sent.");
    return { success: false, error: "Contact form is not configured. Please try again later." };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "HomePosal <onboarding@resend.dev>";
  const preferredContactLabel =
    preferredContactMethod === "phone" ? "Phone" : preferredContactMethod === "text" ? "Text" : "Email";

  try {
    const { error } = await resend.emails.send({
      from,
      to: CONTACT_TO,
      replyTo: email,
      subject: `HomePosal contact from ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 560px;">
          <h2>Contact form submission</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Preferred contact:</strong> ${preferredContactLabel}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : ""}
          <p><strong>Message:</strong></p>
          <div style="white-space: pre-wrap; padding: 12px; background: #f1f5f9; border-radius: 6px;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </div>
      `,
    });

    if (error) {
      console.error("[Contact] Resend error:", error);
      return { success: false, error: "Failed to send. Please try again." };
    }
    return { success: true, message: "Thanks! We'll get back to you soon." };
  } catch (e) {
    console.error("[Contact] send error:", e);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
