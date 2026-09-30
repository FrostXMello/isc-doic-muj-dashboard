"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function InternalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center" role="alert">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-[#f0b4b4]/25 bg-[#f0b4b4]/[0.06]">
        <TriangleAlert className="size-6 text-[#f0b4b4]" aria-hidden />
      </div>
      <h1 className="font-display text-[1.5rem] font-medium tracking-[-0.03em] text-foreground">
        This section could not be loaded
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Something went wrong while reading portal records. Try again, or return to the dashboard.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-[11px] tracking-[0.08em] text-[#6b7c96]">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7e4fb]/30 bg-[#d7e4fb]/10 px-3 text-[13px] font-medium text-[#d7e4fb] hover:bg-[#d7e4fb]/15"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Try again
        </button>
        <Link
          href="/internal"
          className="inline-flex h-9 items-center rounded-lg border border-white/10 px-3 text-[13px] text-[#a9b6cc] hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
