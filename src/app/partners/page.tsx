import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageIntro } from "@/components/page-intro/page-intro";
import { PartnerDirectory } from "@/components/partners/partner-directory";
import { StudyPath } from "@/components/study-path/study-path";
import { institutions } from "@/lib/directory";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partner Universities",
  description:
    "An illustrative directory of sample institutions placed on the DoIC network. Not a published list of agreements.",
};

export default function PartnersPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Partner universities"
          title="Institutions on the illustrative network."
          lede="Browse the sample universities used on the home globe. Filter by region or country, or search by institution name. These are not confirmed partnerships of Manipal University Jaipur."
          meta="Illustrative partners"
        />
        <p className="mt-6 max-w-2xl border-l border-line-bold pl-4 text-sm leading-6 text-muted-foreground">
          Institutions only. Agreement status: Not published yet. Which
          programme applies to an institution: Not published yet. For the
          four descriptions of ways to study, read{" "}
          <Link
            href="/opportunities"
            className="text-primary underline-offset-4 hover:text-foreground hover:underline"
          >
            opportunities
          </Link>
          .
        </p>
        <PartnerDirectory institutions={institutions} />
        <StudyPath current="/partners" />
      </Container>
    </article>
  );
}
