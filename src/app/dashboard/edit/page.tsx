import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProposalForEdit } from "@/lib/actions/updateProposal";
import { EditProposalForm } from "@/components/EditProposalForm";

export default async function DashboardEditPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; type?: string }>;
}) {
  const { id, type } = await searchParams;

  if (!id || !type || (type !== "property" && type !== "place")) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My proposals
        </Link>
        <p className="text-[var(--foreground-muted)]">Invalid edit link. Please choose a proposal from your dashboard.</p>
      </div>
    );
  }

  const result = await getProposalForEdit(id, type);

  if (!result.success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My proposals
        </Link>
        <p className="text-red-500">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My proposals
      </Link>
      <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">Edit proposal</h1>
      <p className="mb-6 text-sm text-[var(--foreground-muted)]">
        Update your offer details. Only pending or active proposals can be edited.
      </p>
      <EditProposalForm proposal={result.proposal} />
    </div>
  );
}
