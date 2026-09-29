"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { portalNav, primaryNav } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

function isActive(pathname: string, href: string) {
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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-out",
        scrolled || open
          ? "border-white/10 bg-[#070b14]/94 backdrop-blur-[2px]"
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
        >
          <Wordmark subtitle={!scrolled} />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
          {primaryNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "py-1 text-[13px] tracking-[0.01em] transition-colors duration-200",
                  active
                    ? "text-foreground shadow-[inset_0_-1px_0_0_#9ec9d4]"
                    : "text-[#9aa8bc] hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <Link
            href={portalNav[0].href}
            aria-current={isActive(pathname, portalNav[0].href) ? "page" : undefined}
            className={cn(
              "border border-[#d7e4fb] bg-[#d7e4fb] px-3 py-[0.4rem] text-[12px] font-medium tracking-[0.01em] text-[#08111f] transition-colors duration-200 hover:bg-[#eef3fb]",
              isActive(pathname, portalNav[0].href) && "shadow-[inset_0_-2px_0_0_#08111f]",
            )}
          >
            {portalNav[0].label}
          </Link>
          <Link
            href={portalNav[1].href}
            aria-current={isActive(pathname, portalNav[1].href) ? "page" : undefined}
            className={cn(
              "border px-3 py-[0.4rem] text-[11px] tracking-[0.14em] uppercase transition-colors duration-200",
              isActive(pathname, portalNav[1].href)
                ? "border-[#9ec9d4]/80 text-foreground"
                : "border-white/18 text-[#9aa8bc] hover:border-white/40 hover:text-foreground",
            )}
          >
            {portalNav[1].label}
          </Link>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="border-white/15 bg-transparent text-foreground hover:bg-white/5 lg:hidden"
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
          className="max-h-[calc(100svh-4.75rem)] overflow-y-auto border-t border-white/10 bg-[#070b14] px-5 py-6 lg:hidden"
        >
          <ul className="flex flex-col">
            {primaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="border-b border-white/10">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block py-3.5 font-display text-[1.65rem] tracking-[-0.03em]",
                      active
                        ? "text-foreground shadow-[inset_0_-1px_0_0_#9ec9d4]"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={portalNav[0].href}
              aria-current={isActive(pathname, portalNav[0].href) ? "page" : undefined}
              className={cn(
                "bg-[#d7e4fb] px-4 py-3 text-center text-sm font-medium text-[#08111f]",
                isActive(pathname, portalNav[0].href) && "shadow-[inset_0_-2px_0_0_#08111f]",
              )}
            >
              {portalNav[0].label}
            </Link>
            <Link
              href={portalNav[1].href}
              aria-current={isActive(pathname, portalNav[1].href) ? "page" : undefined}
              className={cn(
                "border px-4 py-3 text-center text-[12px] tracking-[0.14em] uppercase",
                isActive(pathname, portalNav[1].href)
                  ? "border-[#9ec9d4]/80 text-foreground"
                  : "border-white/20 text-muted-foreground",
              )}
            >
              {portalNav[1].label}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
