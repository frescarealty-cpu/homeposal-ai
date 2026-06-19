"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, X, Mail } from "lucide-react";
import { AccountMenu } from "@/components/AccountMenu";
import { ContactModal } from "@/components/ContactModal";
import {
  CONTACT_INVITE_PREFILL_MESSAGE,
  CONTACT_OWNER_PROPOSAL_PREFILL_MESSAGE,
} from "@/lib/contactInviteDefaults";
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
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    };

    updateHeaderHeight();
    const ro = new ResizeObserver(updateHeaderHeight);
    ro.observe(header);
    window.addEventListener("resize", updateHeaderHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateHeaderHeight);
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, [user, pathname]);

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
    const contactPrefillMap: Record<string, string> = {
      invite: CONTACT_INVITE_PREFILL_MESSAGE,
      "owner-proposal": CONTACT_OWNER_PROPOSAL_PREFILL_MESSAGE,
    };
    const prefill = contact ? contactPrefillMap[contact] : undefined;
    if (!prefill) return;
    setContactInitialMessage(prefill);
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

  const isDetailPage =
    pathname.startsWith("/property/") || pathname.startsWith("/place");

  const headerShellClass = isDetailPage
    ? [
        "min-h-[56px] flex-row items-center justify-between gap-2 py-2",
        "md:min-h-[120px] md:py-2",
        user
          ? "w-full md:gap-4"
          : "md:flex-col md:items-center md:justify-between md:py-3",
      ].join(" ")
    : [
        "min-h-[80px] md:min-h-[120px] md:py-2",
        user
          ? "w-full flex-row items-center justify-between gap-2 md:gap-4"
          : "flex-col items-center justify-between py-3",
      ].join(" ");

  const logoLinkClass = isDetailPage
    ? [
        "flex min-w-0 flex-1 items-center gap-2 text-left md:flex-row md:items-center md:gap-4 md:text-left lg:gap-6",
        user ? "md:flex-initial md:shrink-0" : "md:flex-row md:items-center",
      ].join(" ")
    : [
        "md:gap-4 lg:gap-6",
        user
          ? "flex min-w-0 flex-1 items-center gap-2 text-left md:flex-initial md:shrink-0 md:gap-4"
          : "flex min-w-0 shrink flex-col items-center gap-3 text-center md:flex-row md:items-center",
      ].join(" ");

  const logoImageClass = isDetailPage
    ? [
        "h-10 w-10 sm:h-11 sm:w-11",
        user ? "md:h-28 md:w-28 lg:h-32 lg:w-32" : "md:h-36 md:w-36",
      ].join(" ")
    : user
      ? "h-14 w-14 sm:h-16 sm:w-16 md:h-28 md:w-28 lg:h-32 lg:w-32"
      : "h-20 w-20 md:h-36 md:w-36";

  const titleClass = isDetailPage
    ? "text-sm leading-snug md:whitespace-nowrap md:text-lg lg:text-2xl"
    : user
      ? "text-sm leading-snug sm:text-base md:whitespace-nowrap md:text-lg lg:text-xl"
      : "text-lg break-words sm:text-xl md:whitespace-nowrap lg:text-2xl";

  const taglineClass = [
    "mt-1 hidden font-medium leading-snug text-[var(--foreground-muted)]",
    isDetailPage
      ? "md:block md:whitespace-nowrap md:text-base"
      : user
        ? "md:block md:whitespace-nowrap md:text-sm lg:text-base"
        : "sm:block sm:whitespace-nowrap md:text-base",
  ].join(" ");
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

  const mobileAuthControls = user ? (
    <>
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
      <AccountMenu user={user} onSignOut={handleSignOut} compactOnMobile />
    </>
  ) : null;

  return (
    <header
      ref={headerRef}
      className="relative z-[90] kalshi-border border-x-0 border-t-0 bg-[var(--background-elevated)]"
    >
      <div
        className={[
          "relative mx-auto flex max-w-[1920px] py-2 pl-2 pr-2 md:flex-row md:items-center md:justify-between md:pl-0 md:pr-6",
          headerShellClass,
        ].join(" ")}
      >
        <Link
          href="/"
          onClick={handleLogoClick}
          className={["font-semibold text-[var(--foreground)] md:flex-row md:items-center md:text-left", logoLinkClass].join(
            " "
          )}
        >
          <Image
            src={LOGO_PUBLIC_URL}
            alt="HomePosal"
            width={656}
            height={677}
            className={["shrink-0 object-contain", logoImageClass].join(" ")}
            priority
            unoptimized
          />
          <div
            className={[
              "flex flex-col md:items-start",
              user ? "min-w-0 flex-1" : "min-w-0",
            ].join(" ")}
          >
            {isDetailPage ? (
              <>
                <span className={["font-bold tracking-tight text-[var(--foreground)] md:hidden", titleClass].join(" ")}>
                  HomePosal
                </span>
                <span
                  className={["hidden font-bold tracking-tight text-[var(--foreground)] md:inline", titleClass].join(
                    " "
                  )}
                >
                  SoCal’s Home Proposal Platform
                </span>
              </>
            ) : (
              <span className={["font-bold tracking-tight text-[var(--foreground)]", titleClass].join(" ")}>
                SoCal’s Home Proposal Platform
              </span>
            )}
            <span className={taglineClass}>
              Where{" "}
              <span className="font-semibold" style={{ color: "#10B981" }}>
                suitors propose
              </span>{" "}
              and{" "}
              <span className="font-semibold" style={{ color: "#2C56A3" }}>
                owners choose
              </span>{" "}
              when to say yes.
            </span>
          </div>
        </Link>

        {/* Desktop nav: contact + auth */}
        <div className="hidden shrink-0 md:flex items-center gap-2">
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
            <AccountMenu user={user} onSignOut={handleSignOut} />
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

        {/* Mobile logged-in: inline controls; guest: absolute hamburger */}
        {user ? (
          <div className="flex shrink-0 items-center gap-1 md:hidden">{mobileAuthControls}</div>
        ) : (
          <div className="absolute right-2 top-3 flex md:hidden items-center gap-1" ref={menuRef}>
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
                <div className="flex flex-col gap-0 px-2">{guestNavLinks}</div>
              </div>
            )}
          </div>
        )}
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
