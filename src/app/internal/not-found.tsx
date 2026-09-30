import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function InternalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0d1526]">
        <FileQuestion className="size-6 text-[#6b7c96]" aria-hidden />
      </div>
      <p className="font-mono text-[11px] tracking-[0.16em] text-[#6b7c96] uppercase">404</p>
      <h1 className="mt-2 font-display text-[1.5rem] font-medium tracking-[-0.03em] text-foreground">
        Record not found
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page or record you requested does not exist in the portal. It may have been removed,
        or the link may be incorrect.
      </p>
      <Link
        href="/internal"
        className="mt-6 inline-flex h-9 items-center rounded-lg border border-white/10 px-3 text-[13px] text-[#a9b6cc] hover:text-foreground"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
