import { Container } from "@/components/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function PagePlaceholder({
  eyebrow,
  title,
  lede,
  next,
  related,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  next: readonly { title: string; detail: string }[];
  related?: readonly {
    href:
      | "/"
      | "/opportunities"
      | "/partners"
      | "/programs"
      | "/about"
      | "/student-portal"
      | "/internal"
      | "/privacy"
      | "/terms";
    label: string;
  }[];
}) {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,4.6rem)] leading-[0.98] font-medium tracking-[-0.04em] text-balance text-foreground">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {lede}
        </p>

        <section
          aria-labelledby="coming-next"
          className="mt-14 border border-line bg-surface"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-6 py-4">
            <h2 id="coming-next" className="font-display text-xl tracking-[-0.03em]">
              Coming next
            </h2>
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Not in this stage
            </p>
          </div>
          <ol>
            {next.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[auto_1fr] gap-4 border-b border-line px-6 py-5 last:border-b-0"
              >
                <span className="pt-0.5 font-display text-sm tracking-[0.14em] text-cyan">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {related && related.length > 0 ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-10 rounded-full border-line-bold bg-transparent px-4 text-foreground hover:bg-overlay",
                )}
              >
                {item.label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : null}
      </Container>
    </article>
  );
}
