export default function NoticeAtCollectionPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        Notice at Collection
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
        FRESCA REALTY INC (dba HomePosal) collects the following information to facilitate
        your proposal:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
        <li>
          <span className="font-medium text-[var(--foreground)]">Identifiers:</span>{" "}
          Name, email, and phone number.
        </li>
        <li>
          <span className="font-medium text-[var(--foreground)]">Property Information:</span>{" "}
          Address and ownership details.
        </li>
        <li>
          <span className="font-medium text-[var(--foreground)]">Financial Information:</span>{" "}
          Proof of funds or pre-approval status.
        </li>
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
        <span className="font-medium text-[var(--foreground)]">Purpose:</span> This data is
        used solely to verify your proposal, prevent fraud, and—upon the owner’s explicit
        request—share your interest with the property owner. We do not sell or share your
        personal information.
      </p>
    </div>
  );
}

