import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, NotStated, PageIntro } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { officialAvailability, officialDocumentLinks, officialDocuments, officialPrograms } from "@/lib/official/internationalization";
import { getPublicInstitution, publicSlug } from "@/lib/official/public";
import { SOURCE_REVIEWED_ON } from "@/lib/official/source";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "International programme types described on Manipal University Jaipur's official Internationalization pages, with the partner institutions each page names.",
};

const documentsById = new Map(officialDocuments.map((doc) => [doc.id, doc]));

export default function ProgramsPage() {
  return (
    <article className="pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Programs"
          title="International programmes at MUJ."
          lede="The programme types DoIC describes on MUJ's official Internationalization pages. Where a page names partner institutions for a programme, they are listed; nothing else is inferred."
          meta={`Source checked ${SOURCE_REVIEWED_ON}`}
        />

        <div className="mt-12">
          {officialPrograms.map((program, index) => {
            const offerings = officialAvailability.filter((row) => row.programId === program.id);
            const documents = officialDocumentLinks
              .filter((link) => link.programId === program.id)
              .map((link) => documentsById.get(link.documentId))
              .flatMap((doc) =>
                doc && doc.url && doc.publiclyAccessible ? [{ id: doc.id, title: doc.title, url: doc.url }] : [],
              );
            return (
              <section
                key={program.id}
                id={program.id}
                aria-labelledby={`${program.id}-title`}
                className="scroll-mt-28 border-t border-line py-8 sm:py-10"
              >
                <p className="font-mono text-[12px] tracking-[0.16em] text-fg-subtle">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2
                  id={`${program.id}-title`}
                  className="mt-3 font-display text-[clamp(1.6rem,3vw,2.15rem)] leading-tight tracking-[-0.03em] text-foreground"
                >
                  {program.name}
                </h2>
                <dl className="mt-4 max-w-3xl">
                  <Fact label="What the official page says">{program.description}</Fact>
                  <Fact label="Who it is for">
                    {program.generalAudience ?? <NotStated />}
                  </Fact>
                  <Fact label="Institutions named for this programme">
                    {offerings.length === 0 ? (
                      <NotStated note="The page does not name specific partner institutions for this programme." />
                    ) : (
                      <ul className="space-y-1">
                        {offerings.map((row) => {
                          const institution = getPublicInstitution(publicSlug(row.institutionId));
                          return (
                            <li key={row.id}>
                              {institution ? (
                                <Link
                                  href={`/student-portal/partners/${institution.slug}`}
                                  className="text-primary underline-offset-4 hover:text-foreground hover:underline"
                                >
                                  {institution.name}
                                </Link>
                              ) : (
                                row.institutionId
                              )}
                              {row.duration ? (
                                <span className="text-muted-foreground"> · {row.duration}</span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Fact>
                  <Fact label="Fees, deadlines, availability">
                    <NotStated note="Contact DoIC for current details." />
                  </Fact>
                  <Fact label="Official source">
                    <span className="flex flex-col gap-1">
                      {program.sourceUrl ? (
                        <a
                          href={program.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 text-primary hover:text-foreground"
                        >
                          {program.sourceTitle}
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                      {documents.map((doc) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 text-primary hover:text-foreground"
                        >
                          {doc.title} (PDF)
                          <ArrowUpRight className="size-3.5" aria-hidden="true" />
                        </a>
                      ))}
                    </span>
                  </Fact>
                </dl>
              </section>
            );
          })}
        </div>

        <StudyPath current="/student-portal/programs" />
      </Container>
    </article>
  );
}
