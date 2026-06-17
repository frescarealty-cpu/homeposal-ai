"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { ContactInviteLink } from "@/components/ContactInviteLink";
import { OwnerAddressCheckPanel } from "@/components/OwnerAddressCheckPanel";
import { BANNER_BG, LOGO_BANNER_URL } from "@/lib/siteAssets";

function BannerTitle({
  label,
  headline,
  size = "default",
  multiline = false,
}: {
  label: string;
  headline: string;
  size?: "small" | "default" | "large";
  multiline?: boolean;
}) {
  const titleClass =
    size === "large"
      ? "text-xl font-bold sm:text-2xl md:text-3xl md:text-[2rem]"
      : size === "small"
        ? "text-sm font-semibold sm:text-base"
        : "text-base font-semibold sm:text-lg";

  return (
    <div className="min-w-0 flex-1">
      <h2
        className={[
          "font-sans leading-snug text-[var(--foreground)]",
          multiline ? "line-clamp-2 text-pretty" : "truncate",
          titleClass,
        ].join(" ")}
      >
        {label}
        <span className="mx-1.5" aria-hidden>
          -
        </span>
        {headline}
      </h2>
    </div>
  );
}

function BannerLogo({ className = "h-20 w-20 sm:h-24 sm:w-24" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center bg-transparent ${className}`}>
      <Image
        src={LOGO_BANNER_URL}
        alt=""
        width={656}
        height={677}
        className="h-full w-full object-contain"
        unoptimized
        aria-hidden
      />
    </span>
  );
}

type PlaceOwnerHelloBannerProps = {
  ownerInquiryPhone?: string;
  className?: string;
  defaultExpanded?: boolean;
  /** Milliseconds before auto-collapse; 0 disables. */
  autoCollapseMs?: number;
  alertLabel?: string;
  headline?: string;
  body?: string;
  /** Label for the expand button when the banner is collapsed (Guardian-style bar). */
  collapsedPrimaryLabel?: string;
  /** Pin to the bottom of the viewport (stays visible while scrolling). */
  pinToViewport?: boolean;
  /** Only pin when viewport width is at least this (px). Default 0. */
  pinToViewportMinWidth?: number;
  /** Only pin when viewport width is below this (px). Omit for no upper limit. */
  pinToViewportMaxWidth?: number;
  /** @deprecated Use `pinToViewport` */
  pinToBottom?: boolean;
  /** @deprecated Use `pinToViewportMinWidth` */
  pinToBottomMinWidth?: number;
  /** `compact` = property detail; `cozy` = slightly smaller home index; `default` = full size. */
  size?: "default" | "compact" | "cozy";
  /** Show "Check my address" + search panel (home map). Hide on property/place detail pages. */
  showAddressCheck?: boolean;
};

const VIEWPORT_PIN_Z = 85;
const OWNER_BANNER_OFFSET_VAR = "--owner-banner-offset";
/** Match `layout.tsx` main content column (`max-w-[95%]` / `md:max-w-7xl`). */
const PAGE_WIDTH_CLASS = "mx-auto w-full max-w-[95%] md:max-w-7xl md:min-w-0";

function matchesViewportPinRange(minWidth: number, maxWidth?: number) {
  if (typeof window === "undefined") return false;
  const w = window.innerWidth;
  if (w < minWidth) return false;
  if (maxWidth !== undefined && w >= maxWidth) return false;
  return true;
}

export function PlaceOwnerHelloBanner({
  ownerInquiryPhone = "760-123-4560",
  className = "",
  defaultExpanded = true,
  autoCollapseMs = 10000,
  alertLabel = "Owner Alert",
  headline = "Don't List Yet!",
  body = "Are you the owner and want more information on a proposal?",
  collapsedPrimaryLabel = "Contact Us",
  pinToViewport = false,
  pinToViewportMinWidth = 0,
  pinToViewportMaxWidth,
  pinToBottom,
  pinToBottomMinWidth,
  size = "default",
  showAddressCheck = true,
}: PlaceOwnerHelloBannerProps) {
  const isSlim = size === "compact";
  const isCozy = size === "cozy";
  const pinnedToViewport = pinToViewport || pinToBottom === true;
  const pinnedMinWidth = pinToViewportMinWidth ?? pinToBottomMinWidth ?? 0;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewportPinned, setViewportPinned] = useState(() =>
    pinnedToViewport ? matchesViewportPinRange(pinnedMinWidth, pinToViewportMaxWidth) : false
  );
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [addressFocusToken, setAddressFocusToken] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentId = "place-owner-hello-content";

  const openAddressCheck = () => {
    setExpanded(true);
    setAddressFocusToken((token) => token + 1);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!pinnedToViewport) return;
    const sync = () => {
      setViewportPinned(matchesViewportPinRange(pinnedMinWidth, pinToViewportMaxWidth));
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [pinnedToViewport, pinnedMinWidth, pinToViewportMaxWidth]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobileLayout(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!autoCollapseMs || autoCollapseMs <= 0) return;
    const timer = window.setTimeout(() => setExpanded(false), autoCollapseMs);
    return () => window.clearTimeout(timer);
  }, [autoCollapseMs]);

  useEffect(() => {
    const clearOffsets = () => {
      document.body.style.removeProperty("padding-bottom");
      document.documentElement.style.removeProperty(OWNER_BANNER_OFFSET_VAR);
    };

    if (!viewportPinned || dismissed) {
      clearOffsets();
      return;
    }

    const updatePadding = () => {
      const height = rootRef.current?.offsetHeight ?? 0;
      const cookieOffset = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--cookie-consent-offset") || "0"
      );
      const total = height + (Number.isFinite(cookieOffset) ? cookieOffset : 0);
      if (total > 0) {
        const offset = `${total}px`;
        document.body.style.paddingBottom = offset;
        document.documentElement.style.setProperty(OWNER_BANNER_OFFSET_VAR, offset);
      } else {
        clearOffsets();
      }
    };

    updatePadding();
    const el = rootRef.current;
    if (!el) return;

    const ro = new ResizeObserver(updatePadding);
    ro.observe(el);
    window.addEventListener("resize", updatePadding);
    window.addEventListener("cookie-consent-layout", updatePadding);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updatePadding);
      window.removeEventListener("cookie-consent-layout", updatePadding);
      clearOffsets();
    };
  }, [viewportPinned, dismissed, expanded]);

  if (dismissed) {
    return null;
  }

  const isViewportFixed = pinnedToViewport && viewportPinned;

  if (pinnedToViewport && (!mounted || !viewportPinned)) {
    return null;
  }

  const safePad = isSlim
    ? "pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    : "pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  const shellClass = [
    "w-full shrink-0",
    isViewportFixed
      ? [
          "rounded-t-xl border border-b-0 border-[#1C4482]/15 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]",
          safePad,
        ].join(" ")
      : "overflow-hidden rounded-lg",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const innerClass = "w-full";

  const getLayoutTokens = (collapsed: boolean) => {
    const tightCollapsedBar = collapsed && (isSlim || isCozy || (!isMobileLayout && !isSlim && !isCozy));
    const smallerExpandedChrome = tightCollapsedBar || (isCozy && !collapsed);

    const primaryBtnClass = smallerExpandedChrome
      ? "inline-flex min-h-[36px] items-center justify-center gap-1 rounded-full bg-[#1C4482] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:opacity-90 sm:min-h-[38px] sm:px-3.5 sm:text-sm"
      : "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[#1C4482] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90";
    const secondaryBtnClass = smallerExpandedChrome
      ? "inline-flex min-h-[36px] items-center justify-center rounded-full border border-[#1C4482]/40 bg-transparent px-3 py-1.5 text-xs font-medium text-[#121212] transition-colors hover:bg-[#1C4482]/8 sm:min-h-[38px] sm:px-3.5 sm:text-sm"
      : "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#1C4482]/40 bg-transparent px-4 py-2.5 text-sm font-medium text-[#121212] transition-colors hover:bg-[#1C4482]/8";
    const addressCheckBtnClass = smallerExpandedChrome
      ? "inline-flex min-h-[36px] items-center justify-center rounded-full border border-[#1C4482]/40 bg-white px-3 py-1.5 text-xs font-medium text-[#121212] shadow-sm transition-colors hover:bg-white/90 sm:min-h-[38px] sm:px-3.5 sm:text-sm"
      : "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#1C4482]/40 bg-white px-4 py-2.5 text-sm font-medium text-[#121212] shadow-sm transition-colors hover:bg-white/90";
    const iconBtnClass = smallerExpandedChrome
      ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1C4482]/30 bg-white/80 text-[#1C4482] shadow-sm transition-colors hover:bg-white sm:h-9 sm:w-9"
      : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1C4482]/30 bg-white/80 text-[#1C4482] shadow-sm transition-colors hover:bg-white";

    const logoCollapsed = isSlim
      ? isMobileLayout
        ? "h-10 w-10 shrink-0"
        : "h-12 w-12 shrink-0"
      : isCozy
        ? isMobileLayout
          ? "h-11 w-11 shrink-0"
          : "h-12 w-12 shrink-0"
        : isMobileLayout
          ? "h-14 w-14 shrink-0"
          : "h-14 w-14 shrink-0 sm:h-16 sm:w-16";
    const logoExpanded = isSlim
      ? "h-14 w-14 shrink-0"
      : isCozy
        ? "h-20 w-20 shrink-0 sm:h-24 sm:w-24"
        : "h-28 w-28 sm:h-32 sm:w-32";
    const rowPad = tightCollapsedBar
      ? "px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6"
      : isCozy
        ? "px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3 lg:px-6 lg:py-4"
        : "px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8 lg:py-6";
    const titleSize: "small" | "default" | "large" = tightCollapsedBar
      ? "small"
      : isSlim
        ? "small"
        : isCozy
          ? collapsed
            ? "small"
            : "default"
          : collapsed
            ? "default"
            : "large";
    const rowGap = tightCollapsedBar || isCozy ? "gap-2 sm:gap-3" : "sm:gap-4";

    return {
      primaryBtnClass,
      secondaryBtnClass,
      addressCheckBtnClass,
      iconBtnClass,
      logoCollapsed,
      logoExpanded,
      rowPad,
      titleSize,
      rowGap,
    };
  };

  const renderBanner = (collapsed: boolean) => {
    const t = getLayoutTokens(collapsed);

    if (collapsed && isMobileLayout) {
      return (
        <div
          ref={rootRef}
          role="region"
          aria-label={`${alertLabel}: ${headline}`}
          className={shellClass}
          style={{ backgroundColor: BANNER_BG }}
        >
          <div className={`${innerClass} flex flex-col gap-2 ${t.rowPad}`}>
            <div className={`flex items-center ${isSlim ? "gap-2" : "gap-3"}`}>
              <BannerLogo className={t.logoCollapsed} />
              <BannerTitle label={alertLabel} headline={headline} size={t.titleSize} multiline />
            </div>
            <div className="flex flex-col gap-2">
              {showAddressCheck ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className={`${t.primaryBtnClass} w-full px-3 text-center`}
                      aria-expanded={false}
                      aria-controls={contentId}
                    >
                      {collapsedPrimaryLabel}
                    </button>
                    <button
                      type="button"
                      onClick={openAddressCheck}
                      className={`${t.addressCheckBtnClass} w-full px-3 text-center`}
                    >
                      Check address
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => setDismissed(true)}
                      className={`${t.secondaryBtnClass} w-full px-3 text-center`}
                    >
                      Maybe later
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(true)}
                      className={t.iconBtnClass}
                      aria-expanded={false}
                      aria-controls={contentId}
                      aria-label="Expand owner hello banner"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-[1fr_1fr_auto] items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className={`${t.primaryBtnClass} w-full px-3 text-center`}
                    aria-expanded={false}
                    aria-controls={contentId}
                  >
                    {collapsedPrimaryLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className={`${t.secondaryBtnClass} w-full px-3 text-center`}
                  >
                    Maybe later
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className={t.iconBtnClass}
                    aria-expanded={false}
                    aria-controls={contentId}
                    aria-label="Expand owner hello banner"
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (collapsed) {
      return (
        <div
          ref={rootRef}
          role="region"
          aria-label={`${alertLabel}: ${headline}`}
          className={shellClass}
          style={{ backgroundColor: BANNER_BG }}
        >
          <div
            className={`${innerClass} flex flex-wrap items-center md:flex-nowrap ${t.rowPad} ${t.rowGap}`}
          >
            <BannerLogo className={t.logoCollapsed} />
            <BannerTitle label={alertLabel} headline={headline} size={t.titleSize} />
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={t.primaryBtnClass}
                aria-expanded={false}
                aria-controls={contentId}
              >
                {collapsedPrimaryLabel}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
              {showAddressCheck ? (
                <button type="button" onClick={openAddressCheck} className={t.addressCheckBtnClass}>
                  Check my address
                </button>
              ) : null}
              <button type="button" onClick={() => setDismissed(true)} className={t.secondaryBtnClass}>
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={t.iconBtnClass}
                aria-expanded={false}
                aria-controls={contentId}
                aria-label="Expand owner hello banner"
              >
                <ChevronUp className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isMobileLayout) {
      const pinMobileActions = isViewportFixed && showAddressCheck;
      const hideBannerLogo = pinMobileActions;
      const mobileExpandedMaxH = pinMobileActions
        ? "owner-hello-banner-mobile-viewport-expanded flex min-h-0 flex-col overflow-hidden"
        : isViewportFixed
          ? isSlim
            ? "max-h-[min(420px,calc(100dvh-var(--site-header-height,var(--mobile-header-reserve,11.5rem))-var(--cookie-consent-offset,0px)-env(safe-area-inset-top,0px)))] overflow-y-auto"
            : "max-h-[min(560px,calc(100dvh-var(--site-header-height,var(--mobile-header-reserve,11.5rem))-var(--cookie-consent-offset,0px)-env(safe-area-inset-top,0px)))] overflow-y-auto"
          : [
              "overflow-y-auto",
              isSlim ? "max-h-[min(70vh,420px)]" : "max-h-[min(85vh,560px)]",
            ].join(" ");

      const mobileExpandedBody = (
        <div className={pinMobileActions ? "flex flex-col gap-2.5" : "flex flex-col gap-3"}>
          <div className={hideBannerLogo ? "" : "flex items-start gap-2.5"}>
            {!hideBannerLogo ? <BannerLogo className={t.logoExpanded} /> : null}
            <BannerTitle
              label={alertLabel}
              headline={headline}
              size={hideBannerLogo ? "small" : t.titleSize}
              multiline
            />
          </div>
          {body ? (
            <p
              className={[
                "leading-relaxed text-[var(--foreground-muted)]",
                hideBannerLogo ? "text-[0.8125rem] leading-snug" : "text-sm",
              ].join(" ")}
            >
              {body}
            </p>
          ) : null}
          {showAddressCheck ? (
            <OwnerAddressCheckPanel focusToken={addressFocusToken} className={hideBannerLogo ? "" : "mt-1"} />
          ) : null}
        </div>
      );

      const mobileExpandedActions = (
        <div className="flex flex-col gap-2">
          <ContactInviteLink contactType="owner-proposal" className={`${t.primaryBtnClass} w-full`}>
            Get More Info
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ContactInviteLink>
          <a href={`tel:${ownerInquiryPhone}`} className={`${t.secondaryBtnClass} w-full`}>
            Call {ownerInquiryPhone}
          </a>
          <button type="button" onClick={() => setDismissed(true)} className={`${t.secondaryBtnClass} w-full`}>
            Maybe later
          </button>
        </div>
      );

      return (
        <div
          ref={rootRef}
          role="region"
          aria-label={`${alertLabel}: ${headline}`}
          className={[shellClass, "relative", mobileExpandedMaxH].join(" ")}
          style={{ backgroundColor: BANNER_BG }}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={`absolute right-3 top-2.5 z-10 ${t.iconBtnClass}`}
            aria-expanded={true}
            aria-controls={contentId}
            aria-label="Collapse owner hello banner"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>

          <div
            id={contentId}
            className={[
              innerClass,
              pinMobileActions
                ? "flex min-h-0 flex-1 flex-col"
                : "flex flex-col gap-3 px-3 py-3 pr-12 sm:px-4 sm:py-4",
            ].join(" ")}
          >
            {pinMobileActions ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5 pr-12 sm:px-4 sm:py-3">
                  {mobileExpandedBody}
                </div>
                <div
                  className="shrink-0 border-t border-[#1C4482]/10 px-3 pb-3 pt-2 sm:px-4 sm:pb-4"
                  style={{ backgroundColor: BANNER_BG }}
                >
                  {mobileExpandedActions}
                </div>
              </>
            ) : (
              <>
                {mobileExpandedBody}
                {mobileExpandedActions}
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={rootRef}
        role="region"
        aria-label={`${alertLabel}: ${headline}`}
        className={[
          shellClass,
          "relative",
          isViewportFixed
            ? isCozy
              ? "max-h-[min(62vh,460px)] overflow-y-auto"
              : "max-h-[min(70vh,520px)] overflow-y-auto"
            : "",
        ].join(" ")}
        style={{ backgroundColor: BANNER_BG }}
      >
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={`absolute right-4 top-3 z-10 sm:right-6 lg:right-8 ${t.iconBtnClass}`}
          aria-expanded={true}
          aria-controls={contentId}
          aria-label="Collapse owner hello banner"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>

        <div
          id={contentId}
          className={[
            innerClass,
            "relative flex flex-col pr-14 md:flex-row md:items-start lg:px-8",
            isSlim
              ? "gap-3 px-3 py-3 sm:px-4 sm:py-4 md:gap-4"
              : isCozy
                ? "gap-3 px-3 py-3 sm:px-5 sm:py-3.5 md:gap-4 lg:py-4"
                : "gap-4 px-4 py-4 sm:px-6 sm:py-5 md:gap-6 lg:py-6",
          ].join(" ")}
        >
          <div className="shrink-0 bg-transparent">
            <BannerLogo className={t.logoExpanded} />
          </div>

          <div className="min-w-0 flex-1">
            <BannerTitle label={alertLabel} headline={headline} size={t.titleSize} />
            {body ? (
              <p
                className={[
                  "mt-2 max-w-2xl leading-relaxed text-[var(--foreground-muted)]",
                  isCozy ? "text-xs sm:text-sm" : "text-sm sm:text-[0.9375rem]",
                ].join(" ")}
              >
                {body}
              </p>
            ) : null}
            {showAddressCheck ? (
              <OwnerAddressCheckPanel focusToken={addressFocusToken} className="mt-3" />
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <ContactInviteLink contactType="owner-proposal" className={t.primaryBtnClass}>
                Get More Info
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ContactInviteLink>
              <a href={`tel:${ownerInquiryPhone}`} className={t.secondaryBtnClass}>
                Call {ownerInquiryPhone}
              </a>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className={`${t.secondaryBtnClass} sm:hidden`}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const banner = renderBanner(!expanded);

  if (isViewportFixed) {
    return createPortal(
      <div
        className="pointer-events-none fixed inset-x-0 flex justify-center"
        style={{ bottom: "var(--cookie-consent-offset, 0px)", zIndex: VIEWPORT_PIN_Z }}
      >
        <div className={`pointer-events-auto ${PAGE_WIDTH_CLASS}`}>{banner}</div>
      </div>,
      document.body
    );
  }

  return banner;
}
