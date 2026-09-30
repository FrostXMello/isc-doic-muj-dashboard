import { Container } from "@/components/container";
import { MovementVisual } from "@/components/editorial/movement-visual";
import { Reveal } from "@/components/reveal/reveal";
import { SectionHeading } from "@/components/section-heading/section-heading";
import { classroomPoints } from "@/lib/data";

export function ClassroomSection() {
  return (
    <section id="classroom" aria-labelledby="classroom-heading" className="bg-background">
      <Container className="py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-5">
            <SectionHeading
              id="classroom-heading"
              eyebrow="International learning"
              title="The world is your classroom."
              description="DoIC and the International Student Cell open MUJ to campuses beyond Jaipur — so a degree here can include time, teaching, and research elsewhere."
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
          <Reveal className="lg:col-span-7" delay={90}>
            <MovementVisual />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
