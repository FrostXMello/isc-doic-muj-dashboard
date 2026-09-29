import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { opportunities } from "@/lib/data";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "How DoIC distinguishes a programme from a partner institution. Credit, duration, and assignment are not published.",
};

export default function ProgramsPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Programs"
          title="A programme is a way of studying."
          lede="A partner is an institution. A programme is the form of the time away — an exchange, a semester, a pathway, or a visit. This page does not assign either one to a student, and it does not state credit, fees, or dates."
          meta="Not a catalogue of places"
        />

        <section aria-labelledby="known-forms" className="mt-12">
          <h2
            id="known-forms"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Forms described so far.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Only the four notes already published under opportunities. Opening
            one shows that wording. It does not show which institution, if any,
            is involved.
          </p>
          <ol className="mt-6 border-t border-white/10">
            {opportunities.map((item, index) => (
              <li key={item.id} className="border-b border-white/10">
                <Link
                  href={`/opportunities#${item.id}`}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 py-5 transition-colors hover:bg-white/[0.025] sm:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)] sm:items-baseline sm:gap-6 sm:px-2"
                >
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[#7f93ab]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[1.3rem] tracking-[-0.03em] text-foreground">
                    {item.title}
                  </span>
                  <span className="col-start-2 text-sm leading-relaxed text-muted-foreground sm:col-start-3">
                    {item.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="not-stated" className="mt-14 max-w-3xl">
          <h2
            id="not-stated"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Unpublished.
          </h2>
          <dl className="mt-4 border-t border-white/10">
            <Fact label="Which programme applies to a student">
              <Unpublished />
            </Fact>
            <Fact label="Which institution offers which programme">
              <Unpublished note="The directory and these notes are separate lists." />
            </Fact>
            <Fact label="Credit and recognition on return to MUJ">
              <Unpublished />
            </Fact>
            <Fact label="Duration beyond the short description">
              <Unpublished note="Where a note mentions a term, a semester, or a short visit, that wording is the whole of what is published." />
            </Fact>
            <Fact label="Incoming study in Jaipur">
              <Unpublished />
            </Fact>
          </dl>
        </section>

        <StudyPath current="/programs" />
      </Container>
    </article>
  );
}
