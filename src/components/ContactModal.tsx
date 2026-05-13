"use client";

import { useState, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import { sendContactForm } from "@/lib/actions/sendContactForm";

const TOUCH_MIN = "min-h-[44px]";

export function ContactModal({
  onClose,
  initialMessage,
}: {
  onClose: () => void;
  initialMessage?: string | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState<"email" | "phone">("email");
  const [message, setMessage] = useState("");
  const [humanChecked, setHumanChecked] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!humanChecked) {
        setErrorMessage("Please confirm you are human.");
        setStatus("error");
        return;
      }
      if (preferredContactMethod === "phone" && !phone.trim()) {
        setErrorMessage("Please enter your phone number (or choose Email).");
        setStatus("error");
        return;
      }
      setStatus("sending");
      setErrorMessage("");
      const result = await sendContactForm({
        name,
        email,
        phone,
        preferredContactMethod,
        message,
        honeypot,
      });
      if (result.success) {
        setStatus("success");
        setName("");
        setEmail("");
        setPhone("");
        setPreferredContactMethod("email");
        setMessage("");
        setHumanChecked(false);
        setHoneypot("");
      } else {
        setStatus("error");
        setErrorMessage(result.error);
      }
    },
    [name, email, phone, preferredContactMethod, message, humanChecked, honeypot]
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 shadow-xl kalshi-border sm:p-6">
        <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 pb-3 pt-1 sm:-mx-6 sm:px-6">
          <h2 id="contact-modal-title" className="text-lg font-semibold text-[var(--foreground)]">
            {status === "success" ? "HomePosal Got It!" : "Contact HomePosal"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg p-2 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] ${TOUCH_MIN} inline-flex items-center justify-center`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === "success" ? (
          <div className="py-4">
            <p className="text-base text-[var(--foreground)]">
              Thanks! We&apos;ll get back to you soon.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`mt-4 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white ${TOUCH_MIN} hover:opacity-90`}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="Your name"
                required
                disabled={status === "sending"}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="your@email.com"
                required
                disabled={status === "sending"}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Phone (optional)
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="(555) 123-4567"
                disabled={status === "sending"}
                autoComplete="tel"
                inputMode="tel"
              />
              {preferredContactMethod === "phone" && (
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  Phone is required when “Phone” is selected above.
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="contact-preferred"
                className="mb-1 block text-sm font-medium text-[var(--foreground)]"
              >
                Preferred method of contact
              </label>
              <select
                id="contact-preferred"
                value={preferredContactMethod}
                onChange={(e) => setPreferredContactMethod(e.target.value as "email" | "phone")}
                disabled={status === "sending"}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-[var(--foreground)]">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                placeholder="How can we help?"
                required
                disabled={status === "sending"}
              />
            </div>

            {/* Honeypot: hidden from users, bots often fill it */}
            <div className="absolute -left-[9999px] opacity-0 pointer-events-none" aria-hidden="true">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                id="contact-human"
                type="checkbox"
                checked={humanChecked}
                onChange={(e) => setHumanChecked(e.target.checked)}
                disabled={status === "sending"}
                className="mt-1 h-5 w-5 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                aria-describedby="contact-human-desc"
              />
              <label id="contact-human-desc" htmlFor="contact-human" className="text-sm text-[var(--foreground)] cursor-pointer select-none">
                I'm not a robot (required to prevent spam)
              </label>
            </div>

            {status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={status === "sending" || !humanChecked}
                className={`rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-medium text-white ${TOUCH_MIN} hover:opacity-90 disabled:opacity-50`}
              >
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] ${TOUCH_MIN} hover:bg-[var(--border-subtle)]`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
