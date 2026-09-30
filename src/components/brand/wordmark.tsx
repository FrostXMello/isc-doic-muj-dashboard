import { Mark } from "@/components/brand/mark";
import { site } from "@/lib/data";
import { cn } from "@/lib/utils";

export function Wordmark({
  subtitle = true,
  className,
}: {
  subtitle?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Mark className="size-8 shrink-0 text-primary" />
      <span className="min-w-0 text-left">
        <span className="block font-display text-[15px] leading-none tracking-[0.18em] text-foreground">
          {site.shortName}
        </span>
        {subtitle ? (
          <span className="mt-1.5 hidden text-[11px] leading-none tracking-[0.01em] text-muted-foreground sm:block">
            {site.university}
          </span>
        ) : null}
      </span>
    </span>
  );
}
