"use client";

import { Container } from "@/components/container";
import { networkStats } from "@/lib/data";
import { useEffect, useRef, useState } from "react";

function useCount(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const start = performance.now();
    const duration = reduce ? 0 : 1100;
    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return value;
}

function StatFigure({
  value,
  suffix,
  label,
  active,
  index,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  index: number;
}) {
  const current = useCount(value, active);
  return (
    <div className="flex h-full flex-col bg-surface px-5 py-6 sm:px-6 sm:py-7">
      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <dd className="mt-6 font-display text-[clamp(2rem,2.5vw,2.7rem)] leading-none tracking-[-0.04em] text-foreground tabular-nums">
        {current}
        <span className="text-cyan">{suffix}</span>
      </dd>
      <dt className="mt-3 text-[13px] leading-snug text-fg-soft">{label}</dt>
      <p className="mt-auto pt-5 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
        Illustrative
      </p>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="network"
      aria-labelledby="network-heading"
      className="border-y border-line bg-surface"
    >
      <Container className="py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium tracking-[0.22em] text-cyan uppercase">
              Global network
            </p>
            <h2
              id="network-heading"
              className="mt-3 font-display text-[clamp(1.65rem,2.6vw,2.15rem)] leading-tight tracking-[-0.03em] text-foreground"
            >
              An outline of MUJ&apos;s international reach.
            </h2>
          </div>
          <div className="ml-auto max-w-[16rem] sm:text-right">
            <p className="border border-line-bold px-2.5 py-1 text-[11px] tracking-[0.18em] text-fg-soft uppercase">
              Demo figures
            </p>
            <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
              Not official university statistics.
            </p>
          </div>
        </div>
        <dl className="mt-8 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {networkStats.map((stat, index) => (
            <StatFigure
              key={stat.id}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              active={active}
              index={index}
            />
          ))}
        </dl>
      </Container>
    </section>
  );
}
