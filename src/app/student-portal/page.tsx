import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { contact, opportunities as programmeSummaries, site } from "@/lib/data";
import { officialRegions } from "@/lib/official/countries";
import { globeMarkers, globeTotals } from "@/lib/official/geo";
import {
  officialDocuments,
  officialPrograms,
  otherOfficialListings,
} from "@/lib/official/internationalization";
import { officialSources } from "@/lib/official/source";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Student Portal",
  description:
    "The student hub for international study at MUJ: programmes, partner universities, opportunities, official forms and the DoIC office, each linked to its official source. Sign-in and applications are not part of this stage.",
};

const studentDocuments = ["doc-student-exchange-policy", "doc-credit-mapping-policy", "doc-credit-mapping-form"]
  .map((id) => officialDocuments.find((doc) => doc.id === id))
  .flatMap((doc) => (doc?.url && doc.publiclyAccessible ? [{ id: doc.id, title: doc.title, url: doc.url }] : []));

const studentProgrammeIds = [
  "student-exchange",
  "semester-exchange",
  "pathway-programs",
  "dual-degree",
  "summer-winter-school",
] as const;

const studentProgrammes = studentProgrammeIds.flatMap((id) => {
  const program = officialPrograms.find((row) => row.id === id);
  const summary = programmeSummaries.find((row) => row.id === id);
  return program && summary
    ? [{ id, title: summary.title, summary: summary.summary, sourceUrl: program.sourceUrl }]
    : [];
});

const listingIds = ["scholarships", "internships", "research", "student-bodies", "study-tours"] as const;
const beyondClassroom = otherOfficialListings.filter((row) =>
  (listingIds as readonly string[]).includes(row.id),
);
const admissions = otherOfficialListings.find((row) => row.id === "admissions");

const regionSummary = officialRegions
  .map((region) => ({
    region,
    countries: globeMarkers.filter((marker) => marker.region === region).length,
  }))
  .filter((row) => row.countries > 0);

const processPages = [officialSources.exchange, officialSources.creditForms, officialSources.processOthers];

const sections = [
  { id: "partners", label: "Partner universities" },
  { id: "programmes", label: "Programmes" },
  { id: "beyond", label: "Scholarships & research" },
  { id: "process", label: "Process & forms" },
  { id: "contact", label: "Contact DoIC" },
] as const;

const linkClass = "text-primary underline-offset-4 hover:text-foreground hover:underline";

function SectionTitle({ id, eyebrow, children }: { id: string; eyebrow: string; children: ReactNode }) {
  return (
    <header>
      <p className="text-[11px] tracking-[0.2em] text-cyan uppercase">{eyebrow}</p>
      <h2
        id={id}
        className="mt-2 scroll-mt-28 font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
      >
        {children}
      </h2>
    </header>
  );
}

function OfficialLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-[12px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-foreground"
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  );
}

export default function StudentPortalPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Student portal"
          title="Start here, then read outward."
          lede="The student hub for international study at Manipal University Jaipur: partner universities, programmes, published opportunities, official forms and the DoIC office, each linked to its official MUJ source. This page does not sign you in or take an application."
          meta="Orientation"
        />

        <nav aria-label="On this page" className="mt-8 flex flex-wrap gap-1.5">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="border border-line px-2.5 py-1 text-[12px] text-muted-foreground transition-colors hover:border-line-bold hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <StudyPath label="Explore, understand, compare, contact" />

        <section aria-labelledby="partners" className="mt-16">
          <SectionTitle id="partners" eyebrow="Global network">
            Partner universities.
          </SectionTitle>
          <div className="mt-6 grid gap-px border border-line bg-line lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="bg-surface p-6 sm:p-8">
              <dl className="grid grid-cols-3 gap-4">
                {[
                  { label: "Institutions", value: globeTotals.institutions },
                  { label: "Countries", value: globeTotals.countries },
                  { label: "Regions", value: globeTotals.regions },
                ].map((figure) => (
                  <div key={figure.label}>
                    <dd className="font-display text-[clamp(1.7rem,2.6vw,2.3rem)] leading-none tracking-[-0.04em] text-foreground tabular-nums">
                      {figure.value}
                    </dd>
                    <dt className="mt-2 text-[12px] text-muted-foreground">{figure.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                Counted from MUJ&apos;s{" "}
                <a href={officialSources.partners.url} target="_blank" rel="noreferrer" className={linkClass}>
                  official partner page
                </a>
                . A listing is not an offer of a place or a statement of agreement status.
              </p>
            </div>
            <div className="flex flex-col justify-between gap-6 bg-surface p-6 sm:p-8">
              <ul className="grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                {regionSummary.map((row) => (
                  <li key={row.region} className="flex items-baseline justify-between gap-3 border-b border-line py-2 text-sm">
                    <span className="text-foreground">{row.region}</span>
                    <span className="text-[12px] text-muted-foreground tabular-nums">
                      {row.countries} {row.countries === 1 ? "country" : "countries"}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/partners" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary">
                Browse partner universities by region and country
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="programmes" className="mt-16">
          <SectionTitle id="programmes" eyebrow="Programmes">
            Ways to study abroad.
          </SectionTitle>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The programme types on MUJ&apos;s official Internationalization pages. Calls with dates, such
            as the International Summer School, are on{" "}
            <Link href="/opportunities" className={linkClass}>
              Opportunities
            </Link>
            .
          </p>
          <ul className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {studentProgrammes.map((programme) => (
              <li key={programme.id} className="flex flex-col bg-surface p-6">
                <h3 className="font-display text-lg tracking-[-0.02em] text-foreground">{programme.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{programme.summary}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
                  <Link
                    href={`/programs#${programme.id}`}
                    className="inline-flex items-center gap-1 text-sm text-foreground hover:text-primary"
                  >
                    Details
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                  {programme.sourceUrl ? <OfficialLink href={programme.sourceUrl}>Official page</OfficialLink> : null}
                </div>
              </li>
            ))}
            <li className="flex flex-col bg-surface-raised p-6">
              <h3 className="font-display text-lg tracking-[-0.02em] text-foreground">Published opportunities</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Calls DoIC has published, with the dates and details stated on the official pages.
              </p>
              <div className="mt-auto pt-5">
                <Link
                  href="/opportunities"
                  className="inline-flex items-center gap-1 text-sm text-foreground hover:text-primary"
                >
                  View opportunities
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </div>
            </li>
          </ul>
        </section>

        <section aria-labelledby="beyond" className="mt-16">
          <SectionTitle id="beyond" eyebrow="Beyond the classroom">
            Scholarships, internships and research.
          </SectionTitle>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Listed by DoIC on the official site and linked here rather than copied; check each page for
            current dates.
          </p>
          <ul className="mt-6 border-t border-line">
            {beyondClassroom.map((item) => (
              <li key={item.id} className="border-b border-line">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="grid gap-1 py-4 transition-colors hover:text-primary sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
                >
                  <span className="text-foreground">{item.title}</span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{item.body}</span>
                  <ArrowUpRight className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="process" className="mt-16 max-w-3xl">
          <SectionTitle id="process" eyebrow="Process information">
            Official policy and forms.
          </SectionTitle>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Published by DoIC on MUJ&apos;s{" "}
            <a href={officialSources.creditForms.url} target="_blank" rel="noreferrer" className={linkClass}>
              {officialSources.creditForms.title}
            </a>{" "}
            and Semester Exchange pages. The Student Exchange Policy sets out who may apply for a
            credit exchange and how credits are mapped.
          </p>
          <ul className="mt-4 border-t border-line">
            {studentDocuments.map((doc) => (
              <li key={doc.id} className="border-b border-line">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between gap-4 py-4 text-foreground transition-colors hover:text-primary"
                >
                  <span>{doc.title} (PDF)</span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Official process pages</p>
          <ul className="mt-2 flex flex-col gap-2">
            {processPages.map((page) => (
              <li key={page.url}>
                <a href={page.url} target="_blank" rel="noreferrer" className={`text-sm ${linkClass}`}>
                  {page.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="contact" className="mt-16 max-w-3xl">
          <SectionTitle id="contact" eyebrow="DoIC office">
            Contact DoIC.
          </SectionTitle>
          <dl className="mt-4 border-t border-line">
            <Fact label="Office">
              {contact.office}
              <span className="block text-sm text-muted-foreground">{contact.location}</span>
            </Fact>
            <Fact label="Email">
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </Fact>
            <Fact label="Telephone">{contact.telephone}</Fact>
            {admissions ? (
              <Fact label="Admission as an international student">
                {admissions.body}{" "}
                <a href={admissions.url} target="_blank" rel="noreferrer" className={linkClass}>
                  {admissions.title}
                </a>
              </Fact>
            ) : null}
          </dl>
          <p className="mt-3 text-[12px] leading-5 text-muted-foreground">
            Contact details from the official {contact.source.title}. DoIC owns MUJ&apos;s international
            collaborations; this platform is operated by the {site.cell} for DoIC.{" "}
            <Link href="/about#platform" className={linkClass}>
              About DoIC and this platform
            </Link>
          </p>
        </section>

        <section aria-labelledby="not-here" className="mt-16 max-w-3xl">
          <h2
            id="not-here"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            Not on this page.
          </h2>
          <dl className="mt-4 border-t border-line">
            <Fact label="Sign-in">
              <Unpublished note="There is no account on this stage." />
            </Fact>
            <Fact label="Applications">
              <Unpublished note="Nothing here is submitted, stored, or treated as interest." />
            </Fact>
          </dl>
        </section>
      </Container>
    </article>
  );
}
