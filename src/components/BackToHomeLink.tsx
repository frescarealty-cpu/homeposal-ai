import Link from "next/link";

type BackToHomeLinkProps = {
  className?: string;
  variant?: "link" | "button";
};

export function BackToHomeLink({ className = "", variant = "link" }: BackToHomeLinkProps) {
  if (variant === "button") {
    return (
      <Link
        href="/"
        className={[
          "block w-full rounded-md border border-[var(--border)] px-4 py-2.5 text-center text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)]",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        Back To Home
      </Link>
    );
  }

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
