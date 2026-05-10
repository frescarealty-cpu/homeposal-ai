import Link from "next/link";
import { SignupForm } from "@/components/SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[95%] sm:max-w-md flex-col items-center justify-center px-4 py-8">
      <h1 className="mb-6 text-xl sm:text-2xl font-semibold text-[var(--foreground)]">
        Create account
      </h1>
      <SignupForm redirectTo={redirectTo ?? "/"} />
      <p className="mt-6 text-base text-[var(--foreground-muted)]">
        Already have an account?{" "}
        <Link
          href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
          className="text-[var(--accent)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
