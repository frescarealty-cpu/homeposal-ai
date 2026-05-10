"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import crypto from "crypto";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export type SignupInput = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: "individual_buyer" | "agent" | "investor";
};

export type SignupResult =
  | { success: true; emailSent: boolean; devVerifyUrl?: string }
  | { success: false; error: string };

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

export async function signup(input: SignupInput): Promise<SignupResult> {
  const { fullName, email, password, phone, role } = input;

  if (!fullName?.trim()) return { success: false, error: "Full name is required" };
  if (!email?.trim()) return { success: false, error: "Email is required" };
  if (!password) return { success: false, error: "Password is required" };

  const pwdError = validatePassword(password);
  if (pwdError) return { success: false, error: pwdError };

  const validRoles = ["individual_buyer", "agent", "investor"];
  if (!validRoles.includes(role)) {
    return { success: false, error: "Invalid user role" };
  }

  const supabase = await createClient();
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
      emailRedirectTo: undefined, // We use our own verification
    },
  });

  if (signUpError) {
    const msg = signUpError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("user already")) {
      return { success: false, error: "An account with this email already exists. Please sign in or use “Forgot password” if you don’t remember it." };
    }
    return { success: false, error: signUpError.message };
  }

  // Supabase may return a user with empty identities when email already exists (no error set)
  if (!user || (user.identities && user.identities.length === 0)) {
    return { success: false, error: "An account with this email already exists. Please sign in or use “Forgot password” if you don’t remember it." };
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const adminClient = createAdminClient();
  const emailVal = user.email ?? email.trim() ?? null;
  const profilePayload = {
    id: user.id,
    full_name: fullName.trim(),
    phone: phone?.trim() || null,
    role,
    is_verified: false,
    verification_token: verificationToken,
    verification_token_expires_at: expiresAt.toISOString(),
    ...(emailVal != null ? { email: emailVal } : {}),
  };

  // Upsert: insert or update if trigger already created the row (handles both cases)
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  // If upsert failed due to missing "email" column, retry without email
  let finalError = profileError;
  if (profileError && (profileError.code === "42703" || profileError.message?.includes("email"))) {
    const { email: _e, ...payloadWithoutEmail } = profilePayload;
    const retry = await adminClient.from("profiles").upsert(payloadWithoutEmail, { onConflict: "id" });
    finalError = retry.error;
  }

  if (finalError) {
    console.error("Profile upsert error:", finalError);
    if (finalError.code === "23505" || finalError.message?.toLowerCase().includes("duplicate")) {
      return { success: false, error: "An account with this email already exists. Please sign in or check your email for the verification link." };
    }
    return { success: false, error: `Profile could not be saved: ${finalError.message}. Check that the profiles table exists and the trigger or service role is configured.` };
  }

  // Send verification email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/verify-email?token=${verificationToken}`;

  let emailSent = false;
  const resend = getResend();
  if (resend) {
    try {
      const { data, error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "HomePosal <onboarding@resend.dev>",
        to: email.trim(),
        subject: "Verify your HomePosal account",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Verify your email</h2>
            <p>Hi ${fullName.trim()},</p>
            <p>Thanks for signing up for HomePosal. Click the button below to verify your email and activate your account.</p>
            <p style="margin: 24px 0;">
              <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">Or copy this link: ${verifyUrl}</p>
            <p style="color: #64748b; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
          </div>
        `,
      });
      if (emailError) {
        console.error("Resend error:", emailError);
      } else if (data?.id) {
        emailSent = true;
      }
    } catch (e) {
      console.error("Email send error:", e);
    }
  } else {
    console.log("[DEV] Verification link:", verifyUrl);
  }

  const isDev = process.env.NODE_ENV === "development" || baseUrl.includes("localhost");
  return {
    success: true,
    emailSent,
    ...(isDev && !emailSent ? { devVerifyUrl: verifyUrl } : {}),
  };
}
