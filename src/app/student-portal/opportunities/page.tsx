import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, NotStated, PageIntro } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { opportunities as programmeTypes } from "@/lib/data";
import { formatDate } from "@/lib/internal/dates";
import {
  officialDocuments,
  officialOpportunities,
  otherOfficialListings,
} from "@/lib/official/internationalization";
import { SOURCE_REVIEWED_ON } from "@/lib/official/source";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "International summer and winter schools, exchanges, and other opportunities published by DoIC on Manipal University Jaipur's official pages.",
};

const flyerFor: Record<string, string> = {
  "opp-issmuj-2026": "doc-issmuj-2026-flyer",
  "opp-issmuj-2025": "doc-issmuj-2025-flyer",
  "opp-issmuj-2024": "doc-issmuj-2024-flyer",
};
const documentsById = new Map(officialDocuments.map((doc) => [doc.id, doc]));

const calls = [...officialOpportunities].sort((a, b) => b.id.localeCompare(a.id));

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-1 text-primary hover:text-foreground"
    >
      {children}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  );
}

export default function OpportunitiesPage() {
  return (
    <article className="pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Opportunities"
          title="Ways to study beyond Jaipur."
          lede="Calls and listings published by DoIC on MUJ's official Internationalization pages. Dates are shown exactly as published; always confirm current details on the official page or with DoIC."
          meta={`Source checked ${SOURCE_REVIEWED_ON}`}
        />

        <section aria-labelledby="calls" className="mt-12">
          <h2
            id="calls"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Summer and winter schools.
          </h2>
          <div className="mt-6">
            {calls.map((call) => {
              const flyer = flyerFor[call.id] ? documentsById.get(flyerFor[call.id]) : undefined;
              return (
                <section
                  key={call.id}
                  id={call.id}
                  aria-labelledby={`${call.id}-title`}
                  className="scroll-mt-28 border-t border-line py-8"
                >
                  <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    {call.recordStatus === "archived" ? "Past edition" : "Published call"}
                  </p>
                  <h3
                    id={`${call.id}-title`}
                    className="mt-2 font-display text-[clamp(1.35rem,2.4vw,1.8rem)] leading-tight tracking-[-0.03em] text-foreground"
                  >
                    {call.title}
                  </h3>
                  <dl className="mt-4 max-w-3xl">
                    <Fact label="As published">{call.summary}</Fact>
                    <Fact label="Last date of registration">
                      {call.deadline ? formatDate(call.deadline) : <NotStated />}
                    </Fact>
                    <Fact label="Official source">
                      <span className="flex flex-col">
                        {call.sourceUrl ? (
                          <ExternalLink href={call.sourceUrl}>{call.sourceTitle}</ExternalLink>
                        ) : null}
                        {flyer?.url && flyer.publiclyAccessible ? (
                          <ExternalLink href={flyer.url}>{flyer.title} (PDF)</ExternalLink>
                        ) : null}
                      </span>
                    </Fact>
                  </dl>
                </section>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="types" className="mt-14">
          <h2
            id="types"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Programme types.
          </h2>
          <ul className="mt-6 border-t border-line">
            {programmeTypes.map((item) => (
              <li key={item.id} className="border-b border-line">
                <Link
                  href={`/student-portal/programs#${item.id}`}
                  className="block py-5 transition-colors hover:bg-overlay-subtle sm:px-2"
                >
                  <span className="font-display text-[1.25rem] tracking-[-0.03em] text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-1 block max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {item.summary}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="listings" className="mt-14">
          <h2
            id="listings"
            className="font-display text-[clamp(1.5rem,2.4vw,2rem)] tracking-[-0.03em] text-foreground"
          >
            Other official listings.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            These pages list external programmes and scholarships. They are linked, not
            copied, because their entries and dates change on the official site.
          </p>
          <ul className="mt-6 border-t border-line">
            {otherOfficialListings.map((listing) => (
              <li key={listing.id} className="border-b border-line py-5 sm:px-2">
                <p className="font-display text-[1.2rem] tracking-[-0.03em] text-foreground">
                  {listing.title}
                </p>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {listing.body}
                </p>
                <ExternalLink href={listing.url}>{listing.pageTitle}</ExternalLink>
              </li>
            ))}
          </ul>
        </section>

        <StudyPath current="/student-portal/opportunities" label="Where this sits" />
      </Container>
    </article>
  );
}
