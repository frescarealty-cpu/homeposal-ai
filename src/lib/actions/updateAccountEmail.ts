"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdateAccountEmailResult =
  | { success: true; message: string }
  | { success: false; error: string };

function appBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL ?? "http://localhost:3000";
  return base.startsWith("http") ? base : `https://${base}`;
}

/**
 * Request an email change for the signed-in user (Supabase sends a confirmation link).
 */
export async function updateAccountEmail(newEmail: string): Promise<UpdateAccountEmailResult> {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed) {
    return { success: false, error: "Please enter a new email address." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "You must be signed in to change your email." };
  }

  const current = (user.email ?? "").trim().toLowerCase();
  if (current === trimmed) {
    return { success: false, error: "That is already your email address." };
  }

  const redirectTo = `${appBaseUrl()}/dashboard/settings`;

  const { error } = await supabase.auth.updateUser(
    { email: trimmed },
    { emailRedirectTo: redirectTo }
  );

  if (error) {
    console.error("Update email error:", error);
    return {
      success: false,
      error: error.message || "Failed to update email. Please try again.",
    };
  }

  return {
    success: true,
    message:
      "We sent a confirmation link to your new email address. Click the link to finish updating your account. You may need to sign in again with the new email.",
  };
}
