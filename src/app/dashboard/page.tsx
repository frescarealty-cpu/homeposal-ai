import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getMyProposals } from "@/lib/actions/getMyProposals";
import { MyProposalsDashboard } from "@/components/MyProposalsDashboard";
import { RevisedOfferBanner } from "@/components/RevisedOfferBanner";

export const dynamic = "force-dynamic";

function isRedirectError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ revised?: string }>;
}) {
  try {
    const { revised } = await searchParams;
    const result = await getMyProposals();

    if (!result.success) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-red-500">{result.error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--success)] hover:underline">
            Back to home
          </Link>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-[95%] sm:max-w-2xl px-4 py-8">
        <nav className="mb-6 flex flex-col gap-1">
          <Link
            href="/"
            className="inline-flex min-h-[44px] w-fit items-center gap-2 text-base text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-[44px] w-fit items-center text-sm font-medium text-[var(--accent)] hover:underline"
          >
            Account settings — change password or email
          </Link>
        </nav>
        <h1 className="mb-2 text-xl sm:text-2xl font-semibold text-[var(--foreground)]">My proposals</h1>
        <p className="mb-6 text-base text-[var(--foreground-muted)]">
          View and manage your property and address proposals.
        </p>
        {revised === "1" && <RevisedOfferBanner />}
        <MyProposalsDashboard
          proposals={result.proposals}
          placeProposals={result.placeProposals}
        />
      </div>
    );
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const msg = err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("[Dashboard] page error:", err);
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="font-medium text-[var(--foreground)]">Something went wrong</p>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{msg}</p>
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your deployment environment.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-[var(--success)] hover:underline">
          Back to home
        </Link>
      </div>
    );
  }
}
