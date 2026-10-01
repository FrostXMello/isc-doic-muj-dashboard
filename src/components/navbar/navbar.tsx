"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { useMobileOverlay } from "@/lib/scroll-lock";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

const loginHref = "/login";

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuId = useId();

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setOpen(false), []);
  useMobileOverlay(open, closeMenu);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
        scrolled || open
          ? "border-line bg-background/94 backdrop-blur-[2px]"
          : "border-transparent bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-5 transition-[height] duration-300 ease-out sm:px-8",
          scrolled && !open ? "h-14" : "h-[4.5rem]",
        )}
      >
        <Link
          href="/"
          className="rounded-sm outline-offset-4"
          aria-label="DoIC home, Manipal University Jaipur"
          onClick={closeMenu}
        >
          <Wordmark subtitle={!scrolled} />
        </Link>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle square />
          <Link
            href={loginHref}
            aria-current={isActive(pathname, loginHref) ? "page" : undefined}
            className={cn(
              "border border-primary bg-primary px-3 py-[0.4rem] text-[12px] font-medium tracking-[0.01em] text-primary-foreground transition-colors duration-200 hover:bg-primary/90",
              isActive(pathname, loginHref) && "shadow-[inset_0_-2px_0_0_var(--primary-foreground)]",
            )}
          >
            Login
          </Link>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="border-line-strong bg-transparent text-foreground hover:bg-overlay lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </Button>
      </div>

      {open ? (
        <nav
          id={menuId}
          aria-label="Mobile"
          className="max-h-[calc(100svh-4.75rem)] overflow-y-auto overscroll-contain border-t border-line bg-background px-5 py-6 lg:hidden"
          onClick={(event) => {
            if ((event.target as Element).closest("a")) closeMenu();
          }}
        >
          <div>
            <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              Theme
            </p>
            <ThemeToggle variant="labeled" square />
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={loginHref}
              aria-current={isActive(pathname, loginHref) ? "page" : undefined}
              className={cn(
                "bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground",
                isActive(pathname, loginHref) && "shadow-[inset_0_-2px_0_0_var(--primary-foreground)]",
              )}
            >
              Login
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
