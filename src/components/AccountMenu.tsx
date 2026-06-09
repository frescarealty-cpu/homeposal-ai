"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { User } from "@supabase/supabase-js";

function accountLabel(email: string | undefined): string {
  if (!email) return "Account";
  const local = email.split("@")[0] ?? email;
  return local.length > 18 ? `${local.slice(0, 16)}…` : local;
}

function accountInitial(email: string | undefined): string {
  if (!email) return "?";
  return (email[0] ?? "A").toUpperCase();
}

type AccountMenuProps = {
  user: User;
  onSignOut: () => void;
};

export function AccountMenu({ user, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const label = accountLabel(user.email ?? undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const menuItemClass =
    "block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex max-w-[12rem] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] py-1.5 pl-1.5 pr-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--border-subtle)] sm:max-w-[14rem]"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        title={user.email ?? undefined}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-sm font-semibold text-white"
          aria-hidden
        >
          {accountInitial(user.email ?? undefined)}
        </span>
        <span className="truncate">{label}</span>
        <ChevronDown
          className={["h-4 w-4 shrink-0 text-[var(--foreground-muted)] transition-transform", open ? "rotate-180" : ""].join(
            " "
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] py-1 shadow-lg"
        >
          <Link href="/dashboard" role="menuitem" className={menuItemClass} onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            className={menuItemClass}
            onClick={() => setOpen(false)}
          >
            Account settings
          </Link>
          <div className="my-1 border-t border-[var(--border-subtle)]" />
          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300`}
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            Log off
          </button>
        </div>
      )}
    </div>
  );
}
