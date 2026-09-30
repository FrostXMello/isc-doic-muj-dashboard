import { internalNav } from "@/lib/internal-nav";
import {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Compass,
  FolderOpen,
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  GraduationCap,
  FileText,
  BookOpen,
  Compass,
  FolderOpen,
  CalendarDays,
  BarChart3,
  Settings,
};

/**
 * A reusable empty-state placeholder for portal sections
 * that have not yet been built out.
 */
export function ModulePlaceholder({ moduleHref }: { moduleHref: string }) {
  const navItem = internalNav.find((item) => item.href === moduleHref);
  const Icon = navItem ? iconMap[navItem.icon] : null;

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {Icon && (
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-line bg-card">
          <Icon className="size-7 text-fg-faint" />
        </div>
      )}
      <h1 className="font-display text-[clamp(1.4rem,2.8vw,2rem)] font-medium tracking-[-0.03em] text-foreground">
        {navItem?.label ?? "Module"}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {navItem?.description ??
          "This section will be built in a later development stage."}
      </p>
      <div className="mt-6 inline-flex items-center rounded-full border border-line px-4 py-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
        Coming in a later stage
      </div>
    </div>
  );
}
