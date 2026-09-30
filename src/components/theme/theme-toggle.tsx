"use client";

import {
  setThemePreference,
  useResolvedTheme,
  useThemePreference,
  type ThemePreference,
} from "@/lib/theme-store";
import { cn } from "@/lib/utils";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

// Active styles key off <html data-theme-preference>, which the head script
// sets before paint, so the right option is highlighted before hydration.
const options: readonly {
  value: ThemePreference;
  label: string;
  icon: LucideIcon;
  active: string;
}[] = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    active:
      "[[data-theme-preference=light]_&]:bg-accent [[data-theme-preference=light]_&]:text-foreground [[data-theme-preference=light]_&]:shadow-[inset_0_0_0_1px_var(--line-strong)]",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    active:
      "[[data-theme-preference=dark]_&]:bg-accent [[data-theme-preference=dark]_&]:text-foreground [[data-theme-preference=dark]_&]:shadow-[inset_0_0_0_1px_var(--line-strong)]",
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
    active:
      "[[data-theme-preference=system]_&]:bg-accent [[data-theme-preference=system]_&]:text-foreground [[data-theme-preference=system]_&]:shadow-[inset_0_0_0_1px_var(--line-strong)]",
  },
];

/**
 * Light / Dark / System switch.
 *
 * `compact` shows icons with tooltips and screen-reader labels (headers);
 * `labeled` shows the words too (mobile menus).
 */
export function ThemeToggle({
  variant = "compact",
  square = false,
  className,
}: {
  variant?: "compact" | "labeled";
  square?: boolean;
  className?: string;
}) {
  const preference = useThemePreference();
  const resolved = useResolvedTheme();
  const labeled = variant === "labeled";

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 border border-line-strong p-0.5",
        square ? "rounded-none" : "rounded-lg",
        labeled && "w-full",
        className,
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const tooltip =
          option.value === "system"
            ? `Match system setting (currently ${resolved})`
            : `${option.label} theme`;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={preference === option.value}
            title={tooltip}
            onClick={() => setThemePreference(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 text-fg-subtle transition-colors duration-200 hover:bg-overlay hover:text-foreground focus-visible:outline-offset-1",
              square ? "rounded-none" : "rounded-md",
              labeled ? "h-10 flex-1 px-3 text-[13px]" : "size-7",
              option.active,
            )}
          >
            <Icon className={labeled ? "size-4" : "size-3.5"} aria-hidden />
            {labeled ? option.label : <span className="sr-only">{option.label} theme</span>}
          </button>
        );
      })}
    </div>
  );
}
