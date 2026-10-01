"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AccountSummary } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

function initialsOf(account: AccountSummary) {
  const source = account.name ?? account.email ?? "";
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : source.slice(0, 2);
  return letters.toUpperCase() || "?";
}

/** Signed-in user's name, email, access level, and sign-out. */
export function AccountMenu({
  account,
  variant,
}: {
  account: AccountSummary;
  variant: "portal" | "internal";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const label = account.name ?? account.email ?? "Account";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account: ${label}`}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-2 transition-colors focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none",
          variant === "internal"
            ? "ml-2 rounded-full p-0.5 hover:bg-overlay"
            : "py-1.5 text-[13px] text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center bg-accent text-[11px] font-medium tracking-[0.04em] text-cyan",
            variant === "internal" ? "size-8 rounded-full" : "size-7 border border-line-strong",
          )}
          aria-hidden
        >
          {initialsOf(account)}
        </span>
        {variant === "portal" ? (
          <>
            <span className="hidden max-w-[12rem] truncate sm:inline">{label}</span>
            <ChevronDown className="size-3.5" aria-hidden />
          </>
        ) : null}
      </button>

      {open ? (
        <div
          id={panelId}
          className={cn(
            "absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] border border-line-strong bg-popover p-4 text-popover-foreground shadow-lg",
            variant === "internal" && "rounded-xl",
          )}
        >
          {account.name ? (
            <p className="truncate text-[14px] font-medium text-foreground">{account.name}</p>
          ) : null}
          {account.email ? (
            <p className="truncate text-[13px] text-muted-foreground">{account.email}</p>
          ) : null}
          <p className="mt-3 text-[11px] tracking-[0.14em] text-fg-subtle uppercase">Access level</p>
          <p className="mt-1 text-[13px] text-fg-soft">{account.accessLevel}</p>
          <div className="mt-4 border-t border-line pt-3">
            <SignOutButton
              className={cn(
                "flex w-full items-center gap-2 px-2 py-2 text-left text-[13px] text-fg-soft transition-colors hover:bg-overlay hover:text-foreground disabled:opacity-60",
                variant === "internal" && "rounded-lg",
              )}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
