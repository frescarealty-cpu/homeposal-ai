"use server";

import { createClient } from "@/lib/supabase/server";

export type CheckVerifiedResult = { verified: boolean } | { error: string };

export async function checkUserVerified(): Promise<CheckVerifiedResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { verified: false };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // No profile yet - treat as unverified
    return { verified: false };
  }

  return { verified: !!profile.is_verified };
}
