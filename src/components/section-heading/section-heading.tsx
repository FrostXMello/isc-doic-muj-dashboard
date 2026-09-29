import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  id,
  as = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  id?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  const Heading = as;
  return (
    <header className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">
          {eyebrow}
        </p>
      ) : null}
      <Heading
        id={id}
        className={cn(
          "font-display text-[clamp(1.7rem,3.2vw,3.05rem)] leading-[1.08] font-medium tracking-[-0.035em] text-balance text-foreground",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-relaxed">
          {description}
        </p>
      ) : null}
    </header>
  );
}
