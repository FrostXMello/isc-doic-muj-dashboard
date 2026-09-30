import { Container } from "@/components/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function Cta() {
  return (
    <section aria-labelledby="cta-heading" className="bg-background pb-20 sm:pb-28">
      <Container>
        <div className="relative overflow-hidden border border-line bg-surface-raised px-6 py-14 sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 right-[-10%] h-64 w-64 rounded-full bg-glow/10 blur-3xl"
          />
          <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">
            Directorate of International Collaboration
          </p>
          <h2
            id="cta-heading"
            className="mt-4 max-w-xl font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.04em] text-balance text-foreground"
          >
            Ready to explore the world?
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Start with the opportunities MUJ students can pursue, or look through
            the universities on the illustrative global network.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/opportunities" className={cn(buttonVariants({ size: "xl" }), "group/button")}>
              Explore Opportunities
              <ArrowRight className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
            </Link>
            <Link
              href="/partners"
              className={cn(
                buttonVariants({ variant: "outline", size: "xl" }),
                "border-line-bold bg-transparent text-foreground hover:bg-overlay",
              )}
            >
              View Global Partners
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
