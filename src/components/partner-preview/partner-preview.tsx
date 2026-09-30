"use client";

import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal/reveal";
import { SectionHeading } from "@/components/section-heading/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { hub, partners, type Partner, type PartnerRegion } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

const regionOrder: readonly PartnerRegion[] = [
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "North America",
];

const orderedPartners: readonly Partner[] = regionOrder.flatMap((region) =>
  partners.filter((partner) => partner.region === region),
);

function formatCoord(value: number, positive: string, negative: string) {
  const hemisphere = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(1)}° ${hemisphere}`;
}

export function PartnerPreview() {
  const [activeId, setActiveId] = useState(orderedPartners[0].id);
  const baseId = useId();
  const active =
    orderedPartners.find((partner) => partner.id === activeId) ?? orderedPartners[0];

  const move = (direction: 1 | -1) => {
    const index = orderedPartners.findIndex((partner) => partner.id === active.id);
    const next = orderedPartners[(index + direction + orderedPartners.length) % orderedPartners.length];
    setActiveId(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <section id="partners" aria-labelledby="partners-heading" className="bg-background">
      <Container className="py-20 sm:py-28">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              id="partners-heading"
              eyebrow="Global partners"
              title="From Jaipur to partner campuses."
              description="Select a country to see where it sits relative to MUJ, and the sample institutions placed there."
            />
            <p className="border border-line-strong px-2.5 py-1 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Illustrative partners
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid border border-line lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
            <div
              role="tablist"
              aria-label="Partner countries by region"
              aria-orientation="vertical"
              className="flex flex-col gap-0 border-b border-line p-3 lg:max-h-[560px] lg:overflow-y-auto lg:border-r lg:border-b-0"
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault();
                  move(1);
                }
                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(-1);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  setActiveId(orderedPartners[0].id);
                  document.getElementById(`${baseId}-tab-${orderedPartners[0].id}`)?.focus();
                }
                if (event.key === "End") {
                  event.preventDefault();
                  const last = orderedPartners[orderedPartners.length - 1];
                  setActiveId(last.id);
                  document.getElementById(`${baseId}-tab-${last.id}`)?.focus();
                }
              }}
            >
              {regionOrder.map((region) => (
                <div
                  key={region}
                  className="mt-3 border-t border-line pt-3 first:mt-0 first:border-t-0 first:pt-1"
                >
                  <p className="px-2 pb-1.5 text-[11px] tracking-[0.18em] text-fg-soft uppercase">
                    {region}
                  </p>
                  {orderedPartners
                    .filter((partner) => partner.region === region)
                    .map((partner) => {
                      const selected = partner.id === active.id;
                      return (
                        <button
                          key={partner.id}
                          id={`${baseId}-tab-${partner.id}`}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          aria-controls={`${baseId}-panel`}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => setActiveId(partner.id)}
                          className={cn(
                            "flex w-full items-baseline justify-between gap-3 border-l px-2 py-2 text-left transition-colors duration-200",
                            selected
                              ? "border-cyan text-foreground"
                              : "border-transparent text-muted-foreground hover:text-foreground",
                          )}
                        >
                          <span>
                            <span className="block text-sm">{partner.country}</span>
                            <span className="mt-0.5 block text-[12px] text-muted-foreground">
                              {partner.city}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>

            <div
              role="tabpanel"
              id={`${baseId}-panel`}
              aria-labelledby={`${baseId}-tab-${active.id}`}
              className="flex min-h-[340px] flex-col justify-between bg-surface p-6 sm:p-8"
            >
              <div>
                <p className="text-[11px] tracking-[0.2em] text-cyan uppercase">
                  {active.region} · from Jaipur
                </p>
                <h3 className="mt-3 font-display text-[clamp(1.85rem,3.2vw,3rem)] leading-[1.02] tracking-[-0.04em] text-foreground">
                  {active.country}
                </h3>
                <p className="mt-2 text-sm text-fg-soft">{active.city}</p>
                <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground sm:text-[15px]">
                  {active.summary}
                </p>
                <Bearing city={active.city} lat={active.lat} lon={active.lon} />
                <ul className="mt-8 divide-y divide-line border-y border-line">
                  {active.universities.map((name) => (
                    <li
                      key={name}
                      className="flex items-center justify-between gap-4 py-3.5 text-sm text-foreground"
                    >
                      <span>{name}</span>
                      <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                        Sample
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Illustrative, not a published agreement.
                </p>
                <Link
                  href="/partners"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-10 rounded-none border-line-bold bg-transparent px-4 text-foreground hover:bg-overlay",
                  )}
                >
                  View partner directory
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

function Bearing({ city, lat, lon }: { city: string; lat: number; lon: number }) {
  const span = 200;
  const origin = 230;
  const x = Math.min(450, Math.max(28, origin + ((lon - hub.lon) / 180) * span));
  const degrees = Math.abs(lon - hub.lon).toFixed(0);
  return (
    <figure className="mt-6">
      <figcaption className="text-[12px] leading-5 text-muted-foreground">
        {formatCoord(lat, "N", "S")}, {formatCoord(lon, "E", "W")} · {degrees}° of
        longitude from Jaipur
      </figcaption>
      <svg viewBox="0 0 480 36" aria-hidden="true" className="mt-2 h-7 w-full">
        <line x1="16" y1="14" x2="464" y2="14" className="stroke-line-strong" strokeWidth="1" />
        <circle cx={origin} cy="14" r="2.5" className="fill-viz-node" />
        <text x={origin - 16} y="30" className="fill-muted-foreground" fontSize="10" fontFamily="inherit">
          Jaipur
        </text>
        <line x1={origin} y1="14" x2={x} y2="14" className="stroke-viz-route" strokeWidth="1" />
        <circle cx={x} cy="14" r="2.5" className="fill-primary" />
        <text x={Math.min(x, 410)} y="8" className="fill-fg-soft" fontSize="10" fontFamily="inherit">
          {city}
        </text>
      </svg>
    </figure>
  );
}
