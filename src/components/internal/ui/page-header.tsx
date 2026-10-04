import { cn } from "@/lib/utils";

/** Small uppercase label with an orange rule, used above headings across the portal. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 text-[11px] font-medium tracking-[0.2em] text-muj-fg uppercase",
        className,
      )}
    >
      <span aria-hidden className="h-px w-6 bg-muj" />
      {children}
    </p>
  );
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "dash-rise flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h1 className="font-display text-[clamp(2rem,4.4vw,3.1rem)] leading-[0.95] font-medium tracking-[-0.045em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-3.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Soft layered surface used for grouped detail content (no hard border). */
export function Panel({
  children,
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section className={cn("portal-surface overflow-hidden", className)} {...props}>
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muj/[0.12]">
            <Icon className="size-4 text-muj-fg" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-[1.2rem] leading-tight font-medium tracking-[-0.03em] text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function NotRecorded({ children = "Not recorded" }: { children?: React.ReactNode }) {
  return <span className="text-fg-faint italic">{children}</span>;
}
