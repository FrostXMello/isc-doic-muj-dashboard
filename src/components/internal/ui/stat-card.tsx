import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "var(--glow)",
  href,
}: {
  label: string;
  value: number | string;
  hint?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  /** Any CSS color; pass a theme token such as `var(--cyan)` so it follows the theme. */
  accent?: string;
  href?: string;
}) {
  const body = (
    <>
      <div
        className="stat-glow pointer-events-none absolute -top-6 -right-6 size-24 rounded-full blur-2xl"
        style={{
          backgroundColor: `color-mix(in srgb, ${accent} var(--stat-glow-strength), transparent)`,
          opacity: 0.08,
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] tracking-[0.04em] text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-[2rem] leading-none font-medium tracking-[-0.04em] text-foreground tabular-nums">
            {value}
          </p>
        </div>
        {Icon && <Icon className="size-5 shrink-0" style={{ color: `color-mix(in srgb, ${accent} 56%, transparent)` }} />}
      </div>
      {hint && <div className="relative mt-3 text-[12px] text-muted-foreground/80">{hint}</div>}
    </>
  );

  const className =
    "group relative block overflow-hidden rounded-xl border border-line bg-card p-5";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(className, "transition-all duration-300 hover:border-line-bold hover:bg-surface-raised")}
      >
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}
