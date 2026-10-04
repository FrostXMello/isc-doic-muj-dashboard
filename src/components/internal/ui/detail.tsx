import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { Eyebrow, Panel, PanelHeader } from "@/components/internal/ui/page-header";
import { cn } from "@/lib/utils";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex min-h-9 items-center gap-1.5 rounded-full text-[13px] text-fg-subtle transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      {children}
    </Link>
  );
}

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
    <header className="dash-rise space-y-5">
      <BackLink href={backHref}>{backLabel}</BackLink>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
          <h1 className="font-display text-[clamp(1.75rem,3.6vw,2.6rem)] leading-[1.02] font-medium tracking-[-0.04em] text-balance text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
          {badges && <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>}
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
            "border-t border-hairline px-6 py-4",
            item.wide && "sm:col-span-2",
          )}
        >
          <dt className="text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-[14px] leading-relaxed text-foreground">{item.value}</dd>
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
    <ul className="divide-y divide-hairline border-t border-hairline">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="portal-row-marker group flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-overlay"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] text-foreground">{item.title}</p>
              {item.meta && (
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{item.meta}</p>
              )}
            </div>
            {item.badge}
            <ChevronRight
              className="size-4 shrink-0 text-fg-dim transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muj-fg motion-reduce:transition-none"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
