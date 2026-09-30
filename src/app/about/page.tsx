import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { contact, site } from "@/lib/data";
import { directorate } from "@/lib/official/internationalization";
import { SOURCE_REVIEWED_ON } from "@/lib/official/source";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About DoIC",
  description:
    "The Directorate of International Collaborations (DoIC) at Manipal University Jaipur: its role, team, and office contact, as published on MUJ's official pages.",
};

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-sm text-primary hover:text-foreground"
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  );
}

export default function AboutPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="About DoIC"
          title={`${directorate.name}.`}
          lede={directorate.summary}
          meta={`Source checked ${SOURCE_REVIEWED_ON}`}
        />
        <p className="mt-4">
          <SourceLink href={directorate.sources.overview.url}>
            Official MUJ source: {directorate.sources.overview.title}
          </SourceLink>
        </p>

        <section aria-labelledby="functions" className="mt-12">
          <h2
            id="functions"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            What the directorate does.
          </h2>
          <ol className="mt-6 border-t border-line">
            {directorate.functions.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-line py-5 sm:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)] sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-[12px] tracking-[0.14em] text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-[1.3rem] tracking-[-0.03em] text-foreground">
                  {item.title}
                </h3>
                <p className="col-start-2 text-sm leading-relaxed text-muted-foreground sm:col-start-3">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="team" className="mt-14 max-w-3xl">
          <h2
            id="team"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Team.
          </h2>
          <dl className="mt-4 border-t border-line">
            {directorate.team.map((person) => (
              <Fact key={person.name} label={person.title}>
                {person.name}
              </Fact>
            ))}
          </dl>
        </section>

        <section aria-labelledby="reach" className="mt-14 max-w-3xl">
          <h2
            id="reach"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Contact the office.
          </h2>
          <dl className="mt-4 border-t border-line">
            <Fact label="Office">
              {contact.office}
              <span className="block text-sm text-muted-foreground">{contact.location}</span>
            </Fact>
            <Fact label="Address">
              {contact.university}
              {contact.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </Fact>
            <Fact label="Email">
              <a
                href={`mailto:${contact.email}`}
                className="text-primary underline-offset-4 hover:text-foreground hover:underline"
              >
                {contact.email}
              </a>
            </Fact>
            <Fact label="Telephone">{contact.telephone}</Fact>
            <Fact label="Visa-related queries">
              <SourceLink href={directorate.visaAssistanceForm}>Visa Assistance Form</SourceLink>
            </Fact>
          </dl>
          <p className="mt-3 text-[12px] leading-5 text-muted-foreground">
            Contact details from the official {contact.source.title} and the {directorate.sources.office.title} page.
          </p>
        </section>

        <section aria-labelledby="platform" className="mt-14 max-w-3xl">
          <h2
            id="platform"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            About this platform.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            DoIC is the university directorate responsible for MUJ&apos;s international
            collaborations. This platform is operated by the {site.cell} for DoIC, to make the
            published information easier to explore. It is not the official MUJ website: DoIC&apos;s
            pages on{" "}
            <a
              href={site.officialSite}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:text-foreground hover:underline"
            >
              jaipur.manipal.edu
            </a>{" "}
            remain the authoritative source, and every record here links back to the page it came
            from. The official pages spell the directorate&apos;s name in more than one way; this site
            uses &ldquo;{directorate.name}&rdquo;, as in the {directorate.sources.letterhead.title}.
          </p>
        </section>

        <StudyPath current="/about" label="Student path" />
      </Container>
    </article>
  );
}
