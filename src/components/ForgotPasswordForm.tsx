"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "@/lib/actions/resetPassword";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await sendPasswordResetEmail(email);

    setLoading(false);
    if (result.success) {
      setMessage(result.message);
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
        <label htmlFor="email" className="mb-1 block text-sm text-[var(--foreground-muted)]">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email address"
          className="kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--success)] py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
