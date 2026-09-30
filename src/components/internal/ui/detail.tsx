import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { Panel, PanelHeader } from "@/components/internal/ui/page-header";
import { cn } from "@/lib/utils";

export function DetailHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
}: {
  backHref: string;
  backLabel: string;
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex min-h-9 items-center gap-1.5 text-[13px] text-[#8a9ab4] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="font-mono text-[11px] tracking-[0.14em] text-[#6b7c96] uppercase">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1.5 font-display text-[clamp(1.4rem,2.8vw,2rem)] leading-tight font-medium tracking-[-0.03em] text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
          {badges && <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function DetailSection({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Panel className={className}>
      <PanelHeader title={title} description={description} icon={icon} action={action} />
      {children}
    </Panel>
  );
}

export type KeyValueItem = { label: string; value: React.ReactNode; wide?: boolean };

export function KeyValueList({
  items,
  className,
}: {
  items: readonly KeyValueItem[];
  className?: string;
}) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "border-b border-white/[0.06] px-5 py-3.5 last:border-b-0",
            item.wide && "sm:col-span-2",
          )}
        >
          <dt className="font-mono text-[10px] tracking-[0.12em] text-[#6b7c96] uppercase">
            {item.label}
          </dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-[#d2dcea]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export type LinkedItem = {
  key: string;
  href: string;
  title: string;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
};

/** List of related records inside a detail section. */
export function LinkedList({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: readonly LinkedItem[];
  emptyTitle: string;
  emptyDescription?: React.ReactNode;
}) {
  if (items.length === 0) {
    return <EmptyState compact title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <ul className="divide-y divide-white/[0.06]">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-foreground">{item.title}</p>
              {item.meta && (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{item.meta}</p>
              )}
            </div>
            {item.badge}
            <ChevronRight
              className="size-4 shrink-0 text-[#4a5b73] transition-colors group-hover:text-[#8a9ab4]"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
