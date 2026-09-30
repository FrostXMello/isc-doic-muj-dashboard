import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageIntro({
  eyebrow,
  title,
  lede,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  meta?: string;
  className?: string;
}) {
  return (
    <header className={cn("max-w-3xl", className)}>
      <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-display text-[clamp(2.05rem,4.2vw,3.35rem)] leading-[1.02] font-medium tracking-[-0.04em] break-words text-foreground">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-relaxed">
        {lede}
      </p>
      {meta ? (
        <p className="mt-5 inline-block border border-line-bold px-2.5 py-1 text-[11px] tracking-[0.16em] text-fg-soft uppercase">
          {meta}
        </p>
      ) : null}
    </header>
  );
}

export function Fact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-line py-4">
      <dt className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1.5 max-w-2xl text-[15px] leading-7 text-fg-soft">{children}</dd>
    </div>
  );
}

/** For facts the official MUJ source does not state. */
export function NotStated({ note }: { note?: string }) {
  return (
    <span className="block">
      <span className="text-foreground">Not stated on the official page</span>
      {note ? (
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{note}</span>
      ) : null}
    </span>
  );
}

/** The only label for information this site does not have. */
export function Unpublished({ note }: { note?: string }) {
  return (
    <span className="block">
      <span className="text-foreground">Not published yet</span>
      {note ? (
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">{note}</span>
      ) : null}
    </span>
  );
}
