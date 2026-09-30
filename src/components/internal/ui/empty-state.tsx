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
        compact ? "px-4 py-8" : "px-6 py-16",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-white/10 bg-[#101a2d]",
          compact ? "mb-3 size-10" : "mb-4 size-12",
        )}
      >
        <Icon className={cn("text-[#6b7c96]", compact ? "size-4" : "size-5")} />
      </div>
      <p className="font-display text-[15px] font-medium tracking-[-0.02em] text-foreground">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
