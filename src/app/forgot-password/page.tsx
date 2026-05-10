import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-[var(--foreground)]">
        Reset your password
      </h1>
      <p className="mb-6 text-center text-sm text-[var(--foreground-muted)]">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-[var(--foreground-muted)]">
        Remember your password?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
