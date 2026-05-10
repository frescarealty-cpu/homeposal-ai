"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { createPortal } from "react-dom";

type SheetContextValue = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SheetContext = createContext<SheetContextValue | null>(null);

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ open, onOpenChange }), [open, onOpenChange]);
  return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
}

function useSheetContext() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("Sheet components must be used within <Sheet />");
  return ctx;
}

export function SheetContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useSheetContext();

  // Keep it simple: when closed, render nothing.
  // (You still get the high-end layout + behavior; transitions can be added later.)
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647]"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      />
      <div
        className={[
          "absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto overscroll-contain",
          "bg-[var(--background)]/95 backdrop-blur-md shadow-xl border-l border-[var(--border)]",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function SheetHeader({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-[var(--foreground)]">{children}</h2>;
}

