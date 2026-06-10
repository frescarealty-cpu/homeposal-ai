import Link from "next/link";

export function BackToHomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-[44px] items-center text-sm text-[var(--success)] hover:underline"
    >
      ← Back to Home
    </Link>
  );
}
