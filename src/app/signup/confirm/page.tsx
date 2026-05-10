import Link from "next/link";

export default async function SignupConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; redirect?: string; emailSent?: string; devLink?: string }>;
}) {
  const { email, redirect: redirectParam, emailSent, devLink } = await searchParams;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/") ? redirectParam : "/dashboard";
  const loginHref = redirectTo !== "/dashboard" ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
  const sent = emailSent !== "0";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-8">
      <div className="w-full rounded-md border border-[var(--border)] bg-[var(--background-elevated)] p-6 text-center">
        <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
          {sent ? "Check your email" : "Verify your account"}
        </h1>
        {sent ? (
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            We&apos;ve sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-[var(--foreground)]">{email}</span>
            ) : (
              "your email address"
            )}
            . Click the link in that email to verify your account and then sign in.
          </p>
        ) : (
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            The verification email could not be sent. Use one of the options below to verify and sign in.
          </p>
        )}
        {devLink ? (
          <p className="mb-4">
            <a
              href={devLink}
              className="inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Verify my email (development link)
            </a>
          </p>
        ) : null}
        <p className="mb-4 text-xs text-[var(--foreground-muted)]">
          {sent ? "Didn't receive it? " : ""}
          Check your spam folder, or{" "}
          <Link href="/verify-email" className="text-[var(--accent)] hover:underline">
            resend verification email
          </Link>
          .
        </p>
        <Link
          href={loginHref}
          className="inline-block rounded-md bg-[var(--success)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Go to Sign in
        </Link>
      </div>
    </div>
  );
}
