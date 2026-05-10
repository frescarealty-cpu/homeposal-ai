import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function ProposalConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; redirect?: string }>;
}) {
  const { type, redirect } = await searchParams;
  const isPlace = type === "place";
  const backHref = redirect && redirect.startsWith("/") ? redirect : "/";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/15">
          <CheckCircle className="h-10 w-10 text-[var(--success)]" aria-hidden />
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">
          Proposal submitted
        </h1>
        <div className="mb-6 space-y-3 text-left text-sm text-[var(--foreground-muted)]">
          <p>
            Your proposal is under review. Please note that all submissions require direct contact from a HomePosal representative to authenticate the proposer&apos;s financial standing. We will reach out via your preferred contact method to verify your proof of funds and pre-qualification letters prior to authorizing this proposal for public display. Thank you for helping us maintain a marketplace of verified, serious interest.
          </p>
          <p>
            <strong className="text-[var(--foreground)]">Pro-Tip:</strong> Have your PDF proof of funds or pre-approval letter ready! Our team will be reaching out via your preferred method of communication to expedite your proposal&apos;s approval.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/dashboard"
            className="block rounded-lg bg-[var(--success)] px-4 py-3 text-center font-medium text-white hover:opacity-90"
          >
            View my proposals
          </Link>
          <Link
            href={backHref}
            className="block rounded-lg border border-[var(--border)] px-4 py-3 text-center text-sm font-medium text-[var(--foreground)] hover:bg-[var(--border-subtle)]"
          >
            {isPlace ? "Back to address" : "Back to property"}
          </Link>
          <Link
            href="/"
            className="block py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
