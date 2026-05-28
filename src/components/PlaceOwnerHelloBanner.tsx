"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { ContactInviteLink } from "@/components/ContactInviteLink";
import { LOGO_BANNER_URL } from "@/lib/siteAssets";

function BannerTitle({
  label,
  headline,
  size = "default",
  multiline = false,
}: {
  label: string;
  headline: string;
  size?: "default" | "large";
  multiline?: boolean;
}) {
  const isLarge = size === "large";

  return (
    <div className="min-w-0 flex-1">
      <h2
        className={[
          "font-sans leading-snug text-[var(--foreground)]",
          multiline ? "line-clamp-2 text-pretty" : "truncate",
          isLarge
            ? "text-xl font-bold sm:text-2xl md:text-3xl md:text-[2rem]"
            : "text-base font-semibold sm:text-lg",
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
  /** Label for the primary CTA when the banner is collapsed (Guardian-style bar). */
  collapsedPrimaryLabel?: string;
  /** Pin full-width to the bottom of the viewport (stays visible while scrolling). */
  pinToViewport?: boolean;
  /** Only pin when viewport width is at least this (px). Default 0. */
  pinToViewportMinWidth?: number;
  /** Only pin when viewport width is below this (px). Omit for no upper limit. */
  pinToViewportMaxWidth?: number;
  /** @deprecated Use `pinToViewport` */
  pinToBottom?: boolean;
  /** @deprecated Use `pinToViewportMinWidth` */
  pinToBottomMinWidth?: number;
};

const BANNER_BG = "#cce7f5";
const VIEWPORT_PIN_Z = 85;

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
}: PlaceOwnerHelloBannerProps) {
  const pinnedToViewport = pinToViewport || pinToBottom === true;
  const pinnedMinWidth = pinToViewportMinWidth ?? pinToBottomMinWidth ?? 0;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewportPinned, setViewportPinned] = useState(() =>
    pinnedToViewport ? matchesViewportPinRange(pinnedMinWidth, pinToViewportMaxWidth) : false
  );
  const [isCompact, setIsCompact] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const contentId = "place-owner-hello-content";

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
    const sync = () => setIsCompact(mq.matches);
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
    if (!viewportPinned || dismissed) {
      document.body.style.removeProperty("padding-bottom");
      return;
    }

    const updatePadding = () => {
      const height = rootRef.current?.offsetHeight ?? 0;
      document.body.style.paddingBottom = height > 0 ? `${height}px` : "";
    };

    updatePadding();
    const el = rootRef.current;
    if (!el) return;

    const ro = new ResizeObserver(updatePadding);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.body.style.removeProperty("padding-bottom");
    };
  }, [viewportPinned, dismissed, expanded]);

  if (dismissed) {
    return null;
  }

  const isViewportFixed = pinnedToViewport && viewportPinned;

  if (pinnedToViewport && (!mounted || !viewportPinned)) {
    return null;
  }

  const viewportFixedStyle = isViewportFixed
    ? ({
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: VIEWPORT_PIN_Z,
        width: "100%",
      } as const)
    : undefined;

  const safePad = "pb-[max(0.75rem,env(safe-area-inset-bottom))]";

  const shellClass = [
    "w-full shrink-0",
    isViewportFixed
      ? `border-t border-[#1C4482]/15 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] ${safePad}`
      : "overflow-hidden rounded-lg",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const innerMaxWidth = "mx-auto w-full max-w-[1920px]";

  const primaryBtnClass =
    "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[#1C4482] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90";
  const secondaryBtnClass =
    "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#1C4482]/40 bg-transparent px-4 py-2.5 text-sm font-medium text-[#121212] transition-colors hover:bg-[#1C4482]/8";
  const iconBtnClass =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#1C4482]/30 bg-white/80 text-[#1C4482] shadow-sm transition-colors hover:bg-white";

  const renderBanner = (collapsed: boolean) => {
    if (collapsed && isCompact) {
      return (
        <div
          ref={rootRef}
          role="region"
          aria-label={`${alertLabel}: ${headline}`}
          className={shellClass}
          style={{ backgroundColor: BANNER_BG, ...viewportFixedStyle }}
        >
          <div className={`${innerMaxWidth} flex flex-col gap-3 px-4 py-3`}>
            <div className="flex items-center gap-3">
              <BannerLogo className="h-14 w-14 shrink-0" />
              <BannerTitle label={alertLabel} headline={headline} multiline />
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] items-stretch gap-2">
              <ContactInviteLink
                contactType="owner-proposal"
                className={`${primaryBtnClass} w-full px-3 text-center`}
              >
                {collapsedPrimaryLabel}
              </ContactInviteLink>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className={`${secondaryBtnClass} w-full px-3 text-center`}
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={iconBtnClass}
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

    if (collapsed) {
      return (
        <div
          ref={rootRef}
          role="region"
          aria-label={`${alertLabel}: ${headline}`}
          className={shellClass}
          style={{ backgroundColor: BANNER_BG, ...viewportFixedStyle }}
        >
          <div
            className={`${innerMaxWidth} flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 md:flex-nowrap lg:px-8`}
          >
            <BannerLogo />
            <BannerTitle label={alertLabel} headline={headline} />
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-nowrap">
              <ContactInviteLink contactType="owner-proposal" className={primaryBtnClass}>
                {collapsedPrimaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ContactInviteLink>
              <button type="button" onClick={() => setDismissed(true)} className={secondaryBtnClass}>
                Maybe later
              </button>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className={iconBtnClass}
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

    if (isCompact) {
      return (
        <div
          ref={rootRef}
          role="region"
          aria-label={`${alertLabel}: ${headline}`}
          className={[shellClass, "relative max-h-[min(85vh,560px)] overflow-y-auto"].join(" ")}
          style={{ backgroundColor: BANNER_BG, ...viewportFixedStyle }}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className={`absolute right-3 top-3 z-10 ${iconBtnClass}`}
            aria-expanded={true}
            aria-controls={contentId}
            aria-label="Collapse owner hello banner"
          >
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>

          <div id={contentId} className={`${innerMaxWidth} flex flex-col gap-4 px-4 py-4 pr-14`}>
            <div className="flex items-start gap-3">
              <BannerLogo className="h-16 w-16 shrink-0" />
              <BannerTitle label={alertLabel} headline={headline} size="large" multiline />
            </div>
            {body ? (
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{body}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              <ContactInviteLink contactType="owner-proposal" className={`${primaryBtnClass} w-full`}>
                Get More Info
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ContactInviteLink>
              <a href={`tel:${ownerInquiryPhone}`} className={`${secondaryBtnClass} w-full`}>
                Call {ownerInquiryPhone}
              </a>
              <button type="button" onClick={() => setDismissed(true)} className={`${secondaryBtnClass} w-full`}>
                Maybe later
              </button>
            </div>
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
          isViewportFixed ? "max-h-[min(70vh,520px)] overflow-y-auto" : "",
        ].join(" ")}
        style={{ backgroundColor: BANNER_BG, ...viewportFixedStyle }}
      >
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={`absolute right-4 top-3 z-10 sm:right-6 lg:right-8 ${iconBtnClass}`}
          aria-expanded={true}
          aria-controls={contentId}
          aria-label="Collapse owner hello banner"
        >
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>

        <div
          id={contentId}
          className={`${innerMaxWidth} relative flex flex-col gap-4 px-4 py-4 pr-14 sm:px-6 sm:py-5 md:flex-row md:items-start md:gap-6 lg:px-8 lg:py-6`}
        >
          <div className="shrink-0 bg-transparent">
            <BannerLogo className="h-28 w-28 sm:h-32 sm:w-32" />
          </div>

          <div className="min-w-0 flex-1">
            <BannerTitle label={alertLabel} headline={headline} size="large" />
            {body ? (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)] sm:text-[0.9375rem]">
                {body}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <ContactInviteLink contactType="owner-proposal" className={primaryBtnClass}>
                Get More Info
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ContactInviteLink>
              <a href={`tel:${ownerInquiryPhone}`} className={secondaryBtnClass}>
                Call {ownerInquiryPhone}
              </a>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className={`${secondaryBtnClass} sm:hidden`}
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
    return createPortal(banner, document.body);
  }

  return banner;
}
