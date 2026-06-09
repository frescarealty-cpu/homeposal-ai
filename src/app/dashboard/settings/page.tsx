import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/AccountSettingsForm";
import { SignedInAs } from "@/components/SignedInAs";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email: emailParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard/settings");
  }

  const currentEmail = user.email ?? "";

  return (
    <div className="mx-auto w-full max-w-[95%] sm:max-w-lg px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex min-h-[44px] items-center gap-2 text-base text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)] sm:text-2xl">
        Account settings
      </h1>
      <SignedInAs email={currentEmail} className="mb-2" />
      <p className="mb-6 text-base text-[var(--foreground-muted)]">
        Update your sign-in password or email address.
      </p>
      {emailParam === "updated" && (
        <div className="mb-6 rounded-md bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          Your email has been updated. If you changed your email, use the new address to sign in next
          time.
        </div>
      )}
      <AccountSettingsForm currentEmail={currentEmail} />
    </div>
  );
}
