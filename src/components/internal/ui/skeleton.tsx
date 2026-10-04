import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("portal-shimmer rounded-md bg-overlay", className)} aria-hidden />;
}

export function ListPageSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading records">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-11 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="flex flex-col gap-2.5 lg:flex-row">
        <Skeleton className="h-11 rounded-full lg:w-80" />
        <Skeleton className="h-11 rounded-full lg:w-40" />
        <Skeleton className="h-11 rounded-full lg:w-40" />
      </div>
      <div className="divide-y divide-hairline border-y border-hairline">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-5">
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
    <div className="space-y-8" role="status" aria-label="Loading record">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-96 max-w-full" />
        <Skeleton className="h-4 w-60 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-56 rounded-[1.5rem]" />
          <Skeleton className="h-40 rounded-[1.5rem]" />
        </div>
        <Skeleton className="h-72 rounded-[1.5rem]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
