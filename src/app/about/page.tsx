import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { classroomPoints, contact, site } from "@/lib/data";

export const metadata: Metadata = {
  title: "About DoIC",
  description:
    "The Directorate of International Collaboration at Manipal University Jaipur, managed by the International Student Cell.",
};

export default function AboutPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="About DoIC"
          title="The office that keeps MUJ in the world."
          lede={`${site.directorate} looks after ${site.universityShort}’s relationships with universities abroad. It is managed by the ${site.cell}, which supports students moving into and out of the university.`}
        />

        <section aria-labelledby="concerns" className="mt-12">
          <h2
            id="concerns"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            What the office is for.
          </h2>
          <ol className="mt-6 border-t border-white/10">
            {classroomPoints.map((point) => (
              <li
                key={point.index}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-white/10 py-5 sm:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)] sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-[12px] tracking-[0.14em] text-[#7f93ab]">
                  {point.index}
                </span>
                <h3 className="font-display text-[1.3rem] tracking-[-0.03em] text-foreground">
                  {point.title}
                </h3>
                <p className="col-start-2 text-sm leading-relaxed text-muted-foreground sm:col-start-3">
                  {point.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="reach" className="mt-14 max-w-3xl">
          <h2
            id="reach"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            How to find the office.
          </h2>
          <dl className="mt-4 border-t border-white/10">
            <Fact label="Directorate">{contact.office}</Fact>
            <Fact label="Cell">{contact.cell}</Fact>
            <Fact label="University">{contact.university}</Fact>
            <Fact label="Address">
              {contact.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </Fact>
            <Fact label="Direct contact">
              <Unpublished note={contact.note} />
            </Fact>
            <Fact label="People in the cell">
              <Unpublished />
            </Fact>
            <Fact label="Email and telephone">
              <Unpublished />
            </Fact>
          </dl>
        </section>

        <StudyPath current="/about" label="Student path" />
      </Container>
    </article>
  );
}
