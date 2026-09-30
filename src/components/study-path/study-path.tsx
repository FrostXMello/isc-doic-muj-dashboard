import { cn } from "@/lib/utils";
import Link from "next/link";

const steps = [
  {
    href: "/opportunities",
    index: "01",
    title: "Explore",
    body: "Read the four kinds of experience that are described.",
  },
  {
    href: "/programs",
    index: "02",
    title: "Understand",
    body: "A programme is a way of studying. It is not linked to an institution here.",
  },
  {
    href: "/partners",
    index: "03",
    title: "Compare",
    body: "Browse sample institutions by region, then country. They are not offers of a place.",
  },
  {
    href: "/about",
    index: "04",
    title: "Contact DoIC",
    body: "The office and the campus address. Direct contact: Not published yet.",
  },
] as const;

export type StudyStepHref = (typeof steps)[number]["href"];

export function StudyPath({
  current,
  label = "Student path",
}: {
  current?: StudyStepHref;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="mt-10">
      <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <ol className="mt-3 border-t border-line">
        {steps.map((step) => {
          const active = step.href === current;
          const className = cn(
            "grid min-h-11 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 px-1 py-4 sm:grid-cols-[3rem_minmax(0,12rem)_minmax(0,1fr)] sm:items-baseline sm:gap-x-6 sm:px-2",
            active && "shadow-[inset_2px_0_0_var(--cyan)]",
          );
          const body = (
            <>
              <span className="font-mono text-[12px] tracking-[0.14em] text-fg-subtle">
                {step.index}
              </span>
              <span className="font-display text-[1.15rem] tracking-[-0.03em] text-foreground sm:text-[1.25rem]">
                {step.title}
              </span>
              <span className="col-start-2 mt-1 text-sm leading-relaxed text-muted-foreground sm:col-start-3 sm:mt-0">
                {step.body}
              </span>
            </>
          );
          return (
            <li key={step.href} className="border-b border-line">
              {active ? (
                <div className={className} aria-current="page">
                  {body}
                </div>
              ) : (
                <Link
                  href={step.href}
                  className={cn(
                    className,
                    "transition-colors duration-200 hover:bg-overlay-subtle",
                  )}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
