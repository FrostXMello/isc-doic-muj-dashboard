import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Metric = {
  label: string;
  /** `null` means the data needed for this figure is not recorded, which differs from 0. */
  value: number | null;
  hint?: string;
  href?: string;
  emphasis?: "warning";
};

function MetricValue({ value, large, emphasis }: { value: number | null; large?: boolean; emphasis?: Metric["emphasis"] }) {
  if (value === null) {
    return <span className={cn("text-fg-faint italic", large ? "text-[15px]" : "text-[12px]")}>Not recorded</span>;
  }
  return (
    <span
      className={cn(
        "tabular-nums",
        large
          ? "font-display text-[2rem] leading-none font-medium tracking-[-0.04em] text-foreground"
          : "text-[13px] font-medium",
        !large && (emphasis === "warning" && value > 0 ? "text-warning-fg" : "text-foreground"),
      )}
    >
      {value}
    </span>
  );
}

/**
 * KPI card: one headline figure plus the related figures that explain it,
 * so related counts sit together instead of in separate tiles.
 */
export function MetricGroup({
  title,
  icon: Icon,
  headline,
  metrics = [],
  href,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  headline: Metric;
  metrics?: readonly Metric[];
  href?: string;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-line bg-card">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <h3 className="flex items-center gap-2 text-[12px] tracking-[0.04em] text-muted-foreground">
          {Icon && <Icon className="size-4 shrink-0 text-glow" />}
          {title}
        </h3>
        {href && (
          <Link
            href={href}
            className="-m-1 rounded p-1 text-fg-dim transition-colors hover:text-foreground"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="px-5 pt-2 pb-4">
        <MetricValue value={headline.value} large />
        <p className="mt-1.5 text-[12px] text-muted-foreground">{headline.label}</p>
        {headline.hint && <p className="mt-0.5 text-[11px] text-fg-faint">{headline.hint}</p>}
      </div>
      {metrics.length > 0 && (
        <ul className="mt-auto divide-y divide-hairline border-t border-hairline">
          {metrics.map((metric) => {
            const row = (
              <>
                <span className="min-w-0 text-[12px] text-fg-soft">
                  {metric.label}
                  {metric.hint && <span className="block text-[11px] text-fg-faint">{metric.hint}</span>}
                </span>
                <span className="shrink-0">
                  <MetricValue value={metric.value} emphasis={metric.emphasis} />
                </span>
              </>
            );
            const className = "flex items-baseline justify-between gap-3 px-5 py-2";
            return (
              <li key={metric.label}>
                {metric.href ? (
                  <Link href={metric.href} className={cn(className, "transition-colors hover:bg-overlay-subtle")}>
                    {row}
                  </Link>
                ) : (
                  <div className={className}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
