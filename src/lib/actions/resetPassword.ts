"use server";

import { createClient } from "@/lib/supabase/server";

export type ResetPasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Send a password reset email to the user.
 * Always returns a neutral message so we don't leak whether the email exists.
 */
export async function sendPasswordResetEmail(email: string): Promise<ResetPasswordResult> {
  const trimmed = email?.trim();
  if (!trimmed) {
    return { success: false, error: "Please enter your email address." };
  }

  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  const redirectUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo: redirectUrl,
  });

  // Always return success message to prevent email enumeration
  if (error) {
    console.error("Password reset error:", error);
    // Still return success message for security
    return {
      success: true,
      message: "If an account exists for this email, we've sent a password reset link. Check your inbox and spam folder.",
    };
  }

  return {
    success: true,
    message: "If an account exists for this email, we've sent a password reset link. Check your inbox and spam folder.",
  };
}
