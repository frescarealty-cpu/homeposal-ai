"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdatePasswordResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Update the user's password after password reset.
 */
export async function updatePassword(newPassword: string): Promise<UpdatePasswordResult> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Password update error:", error);
    return { success: false, error: error.message || "Failed to update password. Please try again." };
  }

  return { success: true, message: "Password updated successfully." };
}
