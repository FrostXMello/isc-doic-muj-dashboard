import { Container } from "@/components/container";
import { OpportunityCard } from "@/components/opportunity-card/opportunity-card";
import { Reveal } from "@/components/reveal/reveal";
import { SectionHeading } from "@/components/section-heading/section-heading";
import { opportunities } from "@/lib/data";

export function OpportunitiesSection() {
  return (
    <section
      id="opportunities"
      aria-labelledby="opportunities-heading"
      className="bg-surface"
    >
      <Container className="py-20 sm:py-28">
        <Reveal>
          <SectionHeading
            id="opportunities-heading"
            eyebrow="Opportunities"
            title="Four ways to begin."
            description="A first look at the kinds of international experience DoIC and the International Student Cell will publish in full."
          />
        </Reveal>
        <div className="mt-12 border-t border-line">
          {opportunities.map((item, index) => (
            <Reveal key={item.id} delay={index * 60}>
              <OpportunityCard
                title={item.title}
                summary={item.summary}
                href={item.href}
                icon={item.icon}
                index={index}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
