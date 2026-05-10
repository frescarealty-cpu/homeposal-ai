"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { checkUserVerified } from "@/lib/actions/checkVerified";

type LoginFormProps = {
  redirectTo: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    // Brief delay so session cookies are available to the server action
    await new Promise((r) => setTimeout(r, 300));

    try {
      const result = await checkUserVerified();
      if ("error" in result) {
        setLoading(false);
        setError(result.error);
        return;
      }
      if (!result.verified) {
        await supabase.auth.signOut();
        setLoading(false);
        setError("Please verify your email to activate your account.");
        return;
      }
    } catch (e) {
      console.error("Verification check failed:", e);
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    setLoading(false);
    window.location.href = redirectTo;
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 px-4 py-2 text-base text-red-500">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-base text-[var(--foreground-muted)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
        />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="block text-base text-[var(--foreground-muted)]">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="min-h-[44px] inline-flex items-center text-base text-[var(--accent)] hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] rounded-md bg-[var(--success)] py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
