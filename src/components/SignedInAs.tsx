type SignedInAsProps = {
  email: string;
  className?: string;
};

export function SignedInAs({ email, className = "" }: SignedInAsProps) {
  return (
    <p className={["text-sm text-[var(--foreground-muted)]", className].filter(Boolean).join(" ")}>
      Signed in as{" "}
      <span className="font-medium text-[var(--foreground)] break-all">{email}</span>
    </p>
  );
}
