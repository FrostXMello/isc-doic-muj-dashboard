import { Container } from "@/components/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFound() {
  return (
    <article className="pt-32 pb-24">
      <Container>
        <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">
          404
        </p>
        <h1 className="mt-4 max-w-xl font-display text-[clamp(2.6rem,6vw,4.4rem)] leading-[0.98] font-medium tracking-[-0.04em] text-foreground">
          This page is not on the map.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
          The address does not match a page on this DoIC platform. The
          network is still on the home page.
        </p>
        <Link href="/" className={cn(buttonVariants({ size: "xl" }), "mt-8")}>
          Return home
        </Link>
      </Container>
    </article>
  );
}
