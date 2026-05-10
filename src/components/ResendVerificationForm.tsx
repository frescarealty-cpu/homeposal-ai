"use client";

import { useState } from "react";
import { resendVerificationEmail } from "@/lib/actions/resendVerificationEmail";

export function ResendVerificationForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const r = await resendVerificationEmail(email);
    setLoading(false);
    if (r.success) {
      setResult({ type: "success", message: r.message });
      setEmail("");
    } else {
      setResult({ type: "error", message: r.error });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full space-y-3">
      <label htmlFor="resend-email" className="block text-sm text-[var(--foreground-muted)]">
        Email address
      </label>
      <input
        id="resend-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="you@example.com"
        className="kalshi-border w-full rounded-md bg-[var(--background)] py-2 px-3 text-sm text-[var(--foreground)]"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[var(--accent)] py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send verification email"}
      </button>
      {result && (
        <p
          className={`text-sm ${result.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
        >
          {result.message}
        </p>
      )}
    </form>
  );
}
