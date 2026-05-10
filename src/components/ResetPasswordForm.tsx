"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updatePassword } from "@/lib/actions/updatePassword";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have the necessary hash fragments from Supabase auth callback
    const hash = window.location.hash;
    if (!hash) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    const result = await updatePassword(password);

    setLoading(false);
    if (result.success) {
      setMessage(result.message);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 px-4 py-2 text-sm text-red-500">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-md bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          {message}
        </div>
      )}
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-[var(--foreground-muted)]">
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Enter your new password"
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm text-[var(--foreground-muted)]">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Confirm your new password"
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--success)] py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
