"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/actions/signup";

type SignupFormProps = {
  redirectTo: string;
};

const USER_ROLES = [
  { value: "individual_buyer", label: "Individual Buyer" },
  { value: "agent", label: "Agent" },
  { value: "investor", label: "Investor" },
] as const;

export function SignupForm({ redirectTo }: SignupFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"individual_buyer" | "agent" | "investor">("individual_buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

    const result = await signup({
      fullName,
      email,
      password,
      phone: phone.trim() || undefined,
      role,
    });

    setLoading(false);
    if (result.success) {
      const params = new URLSearchParams({ email });
      if (redirectTo && redirectTo !== "/dashboard") params.set("redirect", redirectTo);
      if (!result.emailSent) params.set("emailSent", "0");
      if (result.devVerifyUrl) params.set("devLink", result.devVerifyUrl);
      router.push(`/signup/confirm?${params.toString()}`);
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
        <label htmlFor="fullName" className="mb-1 block text-base text-[var(--foreground-muted)]">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
          placeholder="John Smith"
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-1 block text-base text-[var(--foreground-muted)]">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-base text-[var(--foreground-muted)]">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
          placeholder="At least 8 characters, 1 uppercase, 1 number"
        />
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          Min 8 characters, 1 uppercase, 1 lowercase, 1 number
        </p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-base text-[var(--foreground-muted)]">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
        />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-base text-[var(--foreground-muted)]">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
          placeholder="(555) 123-4567"
        />
      </div>
      <div>
        <label htmlFor="role" className="mb-1 block text-base text-[var(--foreground-muted)]">
          User Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as "individual_buyer" | "agent" | "investor")}
          required
          className="kalshi-border w-full min-h-[44px] rounded-md bg-[var(--background)] py-3 px-4 text-base text-[var(--foreground)]"
        >
          {USER_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full min-h-[44px] rounded-md bg-[var(--success)] py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
