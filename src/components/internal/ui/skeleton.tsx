import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("portal-shimmer rounded-md bg-white/[0.04]", className)} aria-hidden />;
}

export function ListPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading records">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex flex-col gap-2.5 lg:flex-row">
        <Skeleton className="h-10 lg:w-72" />
        <Skeleton className="h-10 lg:w-40" />
        <Skeleton className="h-10 lg:w-40" />
      </div>
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1526]">
        <div className="border-b border-white/10 px-5 py-3">
          <Skeleton className="h-3 w-1/3" />
        </div>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-white/[0.06] px-5 py-4 last:border-b-0"
          >
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading record">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-80 max-w-full" />
        <Skeleton className="h-4 w-60 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
