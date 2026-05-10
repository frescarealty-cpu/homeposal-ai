"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase password reset links include hash fragments that need to be processed
    const supabase = createClient();
    const hash = window.location.hash;

    if (hash) {
      // Extract the access_token and other params from the hash
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      if (type === "recovery" && accessToken) {
        // Set the session using the access token from the hash
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          })
          .then(({ error }) => {
            setIsValidating(false);
            if (error) {
              setError("Invalid or expired reset link. Please request a new password reset.");
            }
          });
      } else {
        setIsValidating(false);
        setError("Invalid reset link. Please request a new password reset.");
      }
    } else {
      setIsValidating(false);
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, []);

  if (isValidating) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <p className="text-sm text-[var(--foreground-muted)]">Validating reset link…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <h1 className="mb-6 text-2xl font-semibold text-[var(--foreground)]">
          Reset password
        </h1>
        <div className="w-full rounded-md bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-[var(--foreground)]">
        Reset your password
      </h1>
      <p className="mb-6 text-center text-sm text-[var(--foreground-muted)]">
        Enter your new password below.
      </p>
      <ResetPasswordForm />
    </div>
  );
}
