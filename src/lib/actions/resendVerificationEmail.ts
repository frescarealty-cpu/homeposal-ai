"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import crypto from "crypto";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export type ResendVerificationResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Send a new verification email for an unverified account.
 * Always returns a neutral message so we don't leak whether the email exists.
 */
export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
  const trimmed = email?.trim();
  if (!trimmed) {
    return { success: false, error: "Please enter your email address." };
  }

  const supabase = createAdminClient();
  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id, full_name, is_verified")
    .ilike("email", trimmed)
    .eq("is_verified", false)
    .limit(1);

  if (fetchError) {
    console.error("Resend verification fetch error:", fetchError);
    return { success: true, message: "If an account exists for this email and isn't verified, we've sent a new link. Check your inbox and spam." };
  }

  if (!profiles?.length) {
    return { success: true, message: "If an account exists for this email and isn't verified, we've sent a new link. Check your inbox and spam." };
  }

  const profile = profiles[0];
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      verification_token: verificationToken,
      verification_token_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    console.error("Resend verification update error:", updateError);
    return { success: false, error: "Something went wrong. Please try again later." };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/verify-email?token=${verificationToken}`;
  const fullName = (profile as { full_name?: string }).full_name ?? "there";

  const resend = getResend();
  if (!resend) {
    console.log("[DEV] Resend verification link:", verifyUrl);
    return { success: true, message: "In development, the verification link was logged to the server. Check the terminal." };
  }

  try {
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "HomePosal <onboarding@resend.dev>",
      to: trimmed,
      subject: "Verify your HomePosal account",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Verify your email</h2>
          <p>Hi ${fullName},</p>
          <p>You requested a new verification link. Click the button below to verify your email and activate your account.</p>
          <p style="margin: 24px 0;">
            <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
          <p style="color: #64748b; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
    if (emailError) {
      console.error("Resend verification email error:", emailError);
      const msg = emailError.message?.trim() || String(emailError);
      return {
        success: false,
        error: `Email could not be sent. ${msg} Add RESEND_API_KEY (and RESEND_FROM_EMAIL if using your own domain) to .env.local and restart the dev server.`,
      };
    }
  } catch (e) {
    console.error("Resend verification send error:", e);
    return {
      success: false,
      error: "Email could not be sent. Add RESEND_API_KEY to .env.local and restart the dev server, or use the verification link from the signup confirmation page.",
    };
  }

  return { success: true, message: "If an account exists for this email and isn't verified, we've sent a new link. Check your inbox and spam folder." };
}
