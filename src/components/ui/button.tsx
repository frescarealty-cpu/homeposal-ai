"use client";

import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
  size?: "default" | "sm" | "icon";
};

export function Button({
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex select-none items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default:
      "border-[var(--border)] bg-[var(--foreground)] text-[var(--background)] hover:opacity-90",
    secondary:
      "border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--border-subtle)]",
    ghost:
      "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--border-subtle)]",
  };

  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    default: "h-10 px-4",
    sm: "h-9 px-3",
    icon: "h-10 w-10 px-0",
  };

  return (
    <button
      type={type}
      className={[base, variants[variant], sizes[size], className].join(" ").trim()}
      {...props}
    />
  );
}

