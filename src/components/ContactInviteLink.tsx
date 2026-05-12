"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function ContactInviteLinkInner({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  params.set("contact", "invite");
  const href = `${pathname}?${params.toString()}`;

  return (
    <Link href={href} className={className} scroll={false}>
      {children}
    </Link>
  );
}

/** Preserves current path and query string; opens Contact modal via Header (?contact=invite). */
export function ContactInviteLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<span className={className}>{children}</span>}>
      <ContactInviteLinkInner className={className}>{children}</ContactInviteLinkInner>
    </Suspense>
  );
}
