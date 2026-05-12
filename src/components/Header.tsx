"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, X, Mail } from "lucide-react";
import { ContactModal } from "@/components/ContactModal";
import { CONTACT_INVITE_PREFILL_MESSAGE } from "@/lib/contactInviteDefaults";
import { LOGO_PUBLIC_URL } from "@/lib/siteAssets";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const TOUCH_MIN = "min-h-[44px] min-w-[44px]";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactInitialMessage, setContactInitialMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const contact = searchParams.get("contact");
    if (contact !== "invite") return;
    setContactInitialMessage(CONTACT_INVITE_PREFILL_MESSAGE);
    setContactOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("contact");
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    router.replace(next, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  const navLinks = user ? (
    <>
      <span className="text-sm text-[var(--foreground-muted)] block md:hidden py-2">
        {user.email}
      </span>
      <Link
        href="/dashboard"
        className={`rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] inline-flex items-center ${TOUCH_MIN} md:min-h-0 md:min-w-0`}
        onClick={() => setMenuOpen(false)}
      >
        Dashboard
      </Link>
      <button
        type="button"
        onClick={() => { handleSignOut(); setMenuOpen(false); }}
        className="rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 inline-flex items-center justify-center w-full md:w-auto md:min-h-0 md:min-w-0"
        style={{ minHeight: 44, minWidth: 44 }}
      >
        Log Off
      </button>
    </>
  ) : (
    <>
      <Link
        href="/login"
        className={`rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] inline-flex items-center ${TOUCH_MIN} md:min-h-0 md:min-w-0`}
        onClick={() => setMenuOpen(false)}
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 inline-flex items-center justify-center w-full md:w-auto md:min-h-0 md:min-w-0"
        style={{ minHeight: 44, minWidth: 44 }}
        onClick={() => setMenuOpen(false)}
      >
        Sign up
      </Link>
    </>
  );

  return (
    <header className="kalshi-border border-x-0 border-t-0 bg-[var(--background-elevated)]">
      <div className="relative mx-auto flex min-h-[80px] md:min-h-[120px] max-w-[1920px] flex-col items-center justify-between py-3 pl-2 pr-2 md:flex-row md:items-center md:py-2 md:pl-0 md:pr-6">
        {/* Mobile: logo and title stacked, centered; hamburger absolute right */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex flex-col items-center gap-3 text-center md:flex-row md:items-center md:gap-6 md:text-left font-semibold text-[var(--foreground)] min-w-0 shrink"
        >
          <Image
            src={LOGO_PUBLIC_URL}
            alt="HomePosal"
            width={656}
            height={677}
            className="h-20 w-20 md:h-36 md:w-36 shrink-0 object-contain"
            priority
            unoptimized
          />
          <div className="flex flex-col min-w-0 md:items-start">
            <span className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight text-[var(--foreground)] break-words">
              SoCal’s Home Proposal Platform
            </span>
            <span className="mt-1 hidden text-sm font-medium leading-snug text-[var(--foreground-muted)] sm:block md:text-base">
              Where{" "}
              <span className="font-semibold" style={{ color: "#10B981" }}>
                suitors propose
              </span>{" "}
              and{" "}
              <span className="font-semibold" style={{ color: "#2C56A3" }}>owners choose</span> when to say yes.
            </span>
          </div>
        </Link>

        {/* Desktop nav: contact + auth */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setContactInitialMessage(null);
              setContactOpen(true);
            }}
            className="rounded-lg p-2.5 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Contact HomePosal"
            title="Contact"
          >
            <Mail className="h-5 w-5" />
          </button>
          {user ? (
            <>
              <span className="text-sm text-[var(--foreground-muted)]">
                Signed in as {user.email}
              </span>
              <Link href="/dashboard" className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]">
                Dashboard
              </Link>
              <button type="button" onClick={handleSignOut} className="rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90">
                Log Off
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]">
                Log in
              </Link>
              <Link href="/signup" className="rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: contact + hamburger (absolute so logo/title stay centered) */}
        <div className="absolute right-2 top-3 flex md:hidden items-center gap-1 md:relative md:right-0 md:top-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setContactInitialMessage(null);
              setContactOpen(true);
            }}
            className={`rounded-lg p-2 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] ${TOUCH_MIN} inline-flex items-center justify-center`}
            aria-label="Contact HomePosal"
          >
            <Mail className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className={`rounded-lg p-2 text-[var(--foreground-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)] ${TOUCH_MIN} inline-flex items-center justify-center`}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-[var(--border)] bg-[var(--background-elevated)] py-2 shadow-lg">
              <div className="flex flex-col gap-0 px-2">
                {navLinks}
              </div>
            </div>
          )}
        </div>
      </div>

      {contactOpen && (
        <ContactModal
          initialMessage={contactInitialMessage}
          onClose={() => {
            setContactOpen(false);
            setContactInitialMessage(null);
          }}
        />
      )}
    </header>
  );
}
