"use server";

import { createClient } from "@/lib/supabase/server";

export type ChangePasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Change password for the signed-in user (verifies current password first).
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  if (!currentPassword) {
    return { success: false, error: "Please enter your current password." };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }
  if (currentPassword === newPassword) {
    return { success: false, error: "New password must be different from your current password." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { success: false, error: "You must be signed in to change your password." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Change password error:", updateError);
    return {
      success: false,
      error: updateError.message || "Failed to update password. Please try again.",
    };
  }

  return { success: true, message: "Your password has been updated." };
}
