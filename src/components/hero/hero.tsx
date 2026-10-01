import { Globe } from "@/components/globe/globe";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/lib/data";
import { globeMarkers, globeTotals } from "@/lib/official/geo";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const chipIds = globeMarkers
  .filter((marker) => marker.precision === "city" || marker.institutions >= 3)
  .map((marker) => marker.id);

export function Hero() {
  return (
    <section className="hero-glow relative flex min-h-[100svh] items-start overflow-hidden pt-24 pb-12 lg:items-center lg:pt-20 lg:pb-8">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-8">
        <div className="max-w-xl lg:max-w-[34rem]">
          <p className="hero-rise max-w-md text-[10px] leading-5 font-medium tracking-[0.12em] text-cyan uppercase sm:text-[11px] sm:tracking-[0.16em]">
            {site.university}
            <span className="mx-2 text-fg-dim">/</span>
            <span className="text-fg-soft">{site.directorate}</span>
          </p>
          <h1
            className="hero-rise mt-5 font-display text-[clamp(2.45rem,4.35vw,4.15rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-foreground sm:mt-6"
            style={{ animationDelay: "80ms" }}
          >
            Connecting MUJ
            <span className="mt-[0.14em] block text-[0.72em] leading-[1.02] font-medium tracking-[-0.028em] text-fg-soft">
              to the World.
            </span>
          </h1>
          <p
            className="hero-rise mt-5 max-w-md text-[15px] leading-7 text-fg-soft sm:mt-6 sm:text-base sm:leading-relaxed lg:text-[17px]"
            style={{ animationDelay: "150ms" }}
          >
            Explore Manipal University Jaipur&apos;s international
            collaborations, programmes and global opportunities, as published by
            the {site.directorate}.
          </p>
          <div
            className="hero-rise mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center"
            style={{ animationDelay: "220ms" }}
          >
            <Link
              href="/partners"
              className={cn(
                buttonVariants({ size: "xl" }),
                "group/button rounded-none",
              )}
            >
              Explore Global Partners
              <ArrowRight className="transition-transform duration-200 motion-safe:group-hover/button:translate-x-0.5" />
            </Link>
            <Link
              href="/opportunities"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "rounded-none border-line-bold bg-transparent text-foreground hover:bg-overlay",
              )}
            >
              Explore Opportunities
            </Link>
          </div>
          <p
            className="hero-rise mt-6 max-w-md text-[12px] leading-5 text-muted-foreground"
            style={{ animationDelay: "280ms" }}
            data-globe-note
          >
            {globeTotals.institutions} institutions in {globeTotals.countries} countries,
            mapped at country level from MUJ&apos;s official partner listing.{" "}
            <Link
              href="/partners"
              className="text-foreground underline decoration-line-bold underline-offset-4 hover:decoration-cyan"
            >
              See every partner
            </Link>
          </p>
        </div>
        <div className="min-w-0">
          <Globe markers={globeMarkers} chipIds={chipIds} />
        </div>
      </div>
    </section>
  );
}
