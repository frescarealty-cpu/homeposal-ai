import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo =
    typeof redirectParam === "string" && redirectParam.startsWith("/")
      ? redirectParam
      : "/dashboard";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[95%] sm:max-w-md flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-6 text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
        Sign in
      </h1>
      <LoginForm redirectTo={redirectTo} />
      <p className="mt-4 text-base text-[var(--foreground-muted)]">
        Didn&apos;t receive the verification email?{" "}
        <Link href="/verify-email" className="text-[var(--accent)] hover:underline">
          Resend verification email
        </Link>
      </p>
      <p className="mt-6 text-base text-[var(--foreground-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href={redirectTo !== "/" ? `/signup?redirect=${encodeURIComponent(redirectTo)}` : "/signup"}
          className="text-[var(--accent)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
