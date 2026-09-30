import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { officialDocuments } from "@/lib/official/internationalization";
import { officialSources } from "@/lib/official/source";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Portal",
  description:
    "Orientation for MUJ students considering international study, with links to DoIC's official policy and forms. Sign-in and applications are not part of this stage.",
};

const studentDocuments = ["doc-student-exchange-policy", "doc-credit-mapping-policy", "doc-credit-mapping-form"]
  .map((id) => officialDocuments.find((doc) => doc.id === id))
  .flatMap((doc) => (doc?.url && doc.publiclyAccessible ? [{ id: doc.id, title: doc.title, url: doc.url }] : []));

export default function StudentPortalPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Student portal"
          title="Start here, then read outward."
          lede="An orientation for students at Manipal University Jaipur. Explore the published opportunities, read what each programme means, browse the institutions MUJ lists, then contact DoIC. This page does not sign you in or take an application."
          meta="Orientation"
        />

        <StudyPath label="Explore, understand, compare, contact" />

        <section aria-labelledby="documents" className="mt-14 max-w-3xl">
          <h2
            id="documents"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            Official policy and forms.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Published by DoIC on MUJ&apos;s{" "}
            <a
              href={officialSources.creditForms.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:text-foreground hover:underline"
            >
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
        </section>

        <section aria-labelledby="not-here" className="mt-14 max-w-3xl">
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
