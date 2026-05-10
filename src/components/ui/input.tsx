"use client";

import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={[
        "h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]",
        "placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
});

