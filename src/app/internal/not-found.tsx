import Link from "next/link";
import { buttonClass } from "@/components/internal/ui/button-styles";

export default function InternalNotFound() {
  return (
    <div className="dash-rise flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-[clamp(4rem,12vw,7rem)] leading-none font-medium tracking-[-0.06em] text-muj">
        404
      </p>
      <h1 className="mt-4 font-display text-[1.6rem] font-medium tracking-[-0.03em] text-foreground">
        Record not found
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page or record you requested does not exist in the portal. It may have been removed,
        or the link may be incorrect.
      </p>
      <Link href="/internal" className={buttonClass("secondary", "md") + " mt-7"}>
        Back to dashboard
      </Link>
    </div>
  );
}
