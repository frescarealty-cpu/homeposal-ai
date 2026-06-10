import Link from "next/link";

type BackToHomeLinkProps = {
  className?: string;
};

export function BackToHomeLink({ className = "" }: BackToHomeLinkProps) {
  return (
    <Link
      href="/"
      className={[
        "inline-flex min-h-[44px] items-center text-sm text-[var(--success)] hover:underline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      ← Back to Home
    </Link>
  );
}
