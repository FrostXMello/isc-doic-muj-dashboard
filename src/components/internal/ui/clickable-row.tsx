"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { shouldOpenRow } from "@/lib/internal/row-click";

/**
 * A table row that opens `href` when its empty space is clicked. The record's
 * first-cell link stays the accessible target (keyboard, middle-click, screen
 * readers); this only widens the mouse target. It replaces a CSS stretched
 * link, which escapes the row in engines that don't position table rows and
 * then covers the sidebar and page controls.
 */
export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function onClick(event: MouseEvent<HTMLTableRowElement>) {
    const decision = shouldOpenRow<Element>({
      button: event.button,
      defaultPrevented: event.defaultPrevented,
      modifier: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
      target: event.target instanceof Element ? event.target : null,
      row: event.currentTarget,
      selection: window.getSelection()?.toString() ?? "",
    });
    if (decision === "new-tab") window.open(href, "_blank", "noopener");
    else if (decision === "navigate") router.push(href);
  }

  return (
    <tr className={className} onClick={onClick} data-row-href={href}>
      {children}
    </tr>
  );
}
