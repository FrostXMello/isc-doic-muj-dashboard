import { Container } from "@/components/container";
import { Reveal } from "@/components/reveal/reveal";
import { SectionHeading } from "@/components/section-heading/section-heading";
import { classroomPoints, site } from "@/lib/data";
import { directorate } from "@/lib/official/directorate";
import { officialSources } from "@/lib/official/source";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const roles = [
  {
    id: "doic",
    name: directorate.name,
    short: directorate.shortName,
    role: "Institutional owner",
    body: "Owns MUJ’s international collaborations, agreements and records. The official pages DoIC publishes are the source for every listing here.",
  },
  {
    id: "isc",
    name: site.cell,
    short: "ISC",
    role: "Platform operator",
    body: "Operates this platform for DoIC. ISC does not set or confirm agreements; listings follow MUJ’s official pages.",
  },
] as const;

export function ClassroomSection() {
  return (
    <section id="classroom" aria-labelledby="classroom-heading" className="bg-background">
      <Container className="py-20 sm:py-28">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              id="classroom-heading"
              eyebrow="DoIC and ISC"
              title="The world is your classroom."
              description="DoIC connects MUJ with institutions abroad through student and faculty exchange, semester abroad, pathway and dual degree programmes, and MoUs with educational and research institutes."
            />
            <ol className="mt-10 divide-y divide-line border-y border-line">
              {classroomPoints.map((point) => (
                <li key={point.index} className="grid grid-cols-[auto_1fr] gap-4 py-5">
                  <span className="pt-0.5 font-display text-sm tracking-[0.14em] text-cyan">
                    {point.index}
                  </span>
                  <div>
                    <h3 className="font-display text-lg tracking-[-0.02em] text-foreground">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={90}>
            <div className="border border-line bg-surface">
              <ul className="divide-y divide-line">
                {roles.map((item) => (
                  <li key={item.id} className="p-6 sm:p-8">
                    <p className="text-[11px] tracking-[0.2em] text-cyan uppercase">{item.role}</p>
                    <h3 className="mt-3 font-display text-[clamp(1.35rem,2vw,1.7rem)] leading-tight tracking-[-0.03em] text-foreground">
                      {item.name}{" "}
                      <span className="text-fg-dim">({item.short})</span>
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-3 border-t border-line px-6 py-4 text-[12px] leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <p>
                  {directorate.office.location} ·{" "}
                  <a
                    href={`mailto:${directorate.office.email}`}
                    className="text-foreground underline decoration-line-bold underline-offset-4 hover:decoration-cyan"
                  >
                    {directorate.office.email}
                  </a>
                </p>
                <div className="flex items-center gap-4">
                  <a
                    href={officialSources.overview.url}
                    target="_blank"
                    rel="noreferrer"
                    className="tracking-[0.12em] uppercase hover:text-foreground"
                  >
                    Official MUJ source
                  </a>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-1 text-foreground hover:text-primary"
                  >
                    About DoIC
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
