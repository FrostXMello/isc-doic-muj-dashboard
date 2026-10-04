import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
  compact = false,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-6 py-8" : "px-6 py-16",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-muj/[0.1]",
          compact ? "mb-3 size-10" : "mb-5 size-14",
        )}
      >
        <span aria-hidden className="absolute inset-0 rounded-full border border-dashed border-muj/40" />
        <Icon className={cn("text-muj-fg", compact ? "size-4" : "size-5")} />
      </div>
      <p
        className={cn(
          "font-display font-medium tracking-[-0.025em] text-foreground",
          compact ? "text-[15px]" : "text-[1.25rem]",
        )}
      >
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
