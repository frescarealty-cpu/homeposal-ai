import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { ResendVerificationForm } from "@/components/ResendVerificationForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <div className="w-full rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-6">
          <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Resend verification email
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Enter the email you used to sign up. We’ll send a new verification link.
          </p>
          <ResendVerificationForm />
          <p className="mt-4 text-center text-sm text-[var(--foreground-muted)]">
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              Back to Sign in
            </Link>
            {" · "}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const supabase = createAdminClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("verification_token", token)
    .gt("verification_token_expires_at", new Date().toISOString())
    .limit(1);

  if (error || !profiles?.length) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <div className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
            Link expired or invalid
          </h1>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            This verification link has expired or has already been used. Please sign in or request a new verification email.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/login"
              className="inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-block rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profile = profiles[0];
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      is_verified: true,
      verification_token: null,
      verification_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (updateError) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-6 text-center">
          <h1 className="mb-2 text-xl font-semibold text-red-500">Verification failed</h1>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Something went wrong. Please try again or contact support.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
      <div className="rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-6 text-center">
        <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          Email verified!
        </h1>
        <p className="mb-4 text-sm text-[var(--foreground-muted)]">
          Your account is now active. You can sign in and submit proposals.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
