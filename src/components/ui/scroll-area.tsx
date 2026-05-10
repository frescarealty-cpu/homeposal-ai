"use client";

import * as React from "react";

type ScrollAreaProps = React.HTMLAttributes<HTMLDivElement> & {
  viewportClassName?: string;
};

export function ScrollArea({
  className = "",
  viewportClassName = "",
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <div className={["relative", className].join(" ")} {...props}>
      <div className={["h-full w-full overflow-auto", viewportClassName].join(" ")}>
        {children}
      </div>
    </div>
  );
}

