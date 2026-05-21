"use client";

import { useState } from "react";
import { changePassword } from "@/lib/actions/changePassword";
import { updateAccountEmail } from "@/lib/actions/updateAccountEmail";

type AccountSettingsFormProps = {
  currentEmail: string;
};

export function AccountSettingsForm({ currentEmail }: AccountSettingsFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    setPasswordLoading(false);

    if (result.success) {
      setPasswordMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(result.error);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailMessage(null);

    const trimmed = newEmail.trim().toLowerCase();
    const confirm = confirmEmail.trim().toLowerCase();

    if (trimmed !== confirm) {
      setEmailError("Email addresses do not match.");
      setEmailLoading(false);
      return;
    }

    const result = await updateAccountEmail(trimmed);
    setEmailLoading(false);

    if (result.success) {
      setEmailMessage(result.message);
      setNewEmail("");
      setConfirmEmail("");
    } else {
      setEmailError(result.error);
    }
  };

  const inputClass =
    "kalshi-border w-full rounded-md bg-[var(--background)] py-3 px-4 text-[var(--foreground)]";
  const labelClass = "mb-1 block text-sm text-[var(--foreground-muted)]";
  const alertError = "rounded-md bg-red-500/10 px-4 py-2 text-sm text-red-500";
  const alertSuccess =
    "rounded-md bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400";

  return (
    <div className="space-y-8">
      <section className="kalshi-border rounded-lg p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Change password</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Enter your current password, then choose a new one.
        </p>
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          {passwordError && <div className={alertError}>{passwordError}</div>}
          {passwordMessage && <div className={alertSuccess}>{passwordMessage}</div>}
          <div>
            <label htmlFor="currentPassword" className={labelClass}>
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="newPassword" className={labelClass}>
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="min-h-[44px] rounded-md bg-[var(--success)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {passwordLoading ? "Updating…" : "Update password"}
          </button>
        </form>
      </section>

      <section className="kalshi-border rounded-lg p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Change email</h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Current email: <span className="font-medium text-[var(--foreground)]">{currentEmail}</span>
        </p>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          We will send a confirmation link to your new address before the change takes effect.
        </p>
        <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
          {emailError && <div className={alertError}>{emailError}</div>}
          {emailMessage && <div className={alertSuccess}>{emailMessage}</div>}
          <div>
            <label htmlFor="newEmail" className={labelClass}>
              New email address
            </label>
            <input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmEmail" className={labelClass}>
              Confirm new email address
            </label>
            <input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={emailLoading}
            className="min-h-[44px] rounded-md border border-[var(--border)] bg-[var(--background)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)] disabled:opacity-50"
          >
            {emailLoading ? "Sending…" : "Update email"}
          </button>
        </form>
      </section>
    </div>
  );
}
