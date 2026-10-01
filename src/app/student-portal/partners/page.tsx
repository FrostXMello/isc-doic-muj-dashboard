import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageIntro } from "@/components/page-intro/page-intro";
import { type DirectoryEntry, PartnerDirectory } from "@/components/partners/partner-directory";
import { StudyPath } from "@/components/study-path/study-path";
import {
  officialStats,
  publicAgreementLabel,
  publicInstitutions,
  publicRegions,
} from "@/lib/official/public";
import { officialSources, SOURCE_REVIEWED_ON } from "@/lib/official/source";

export const metadata: Metadata = {
  title: "Partner Universities",
  description:
    "Institutions listed on Manipal University Jaipur's official International Collaborations page, with the agreement wording the page uses.",
};

const NOT_STATED = "Type not stated";

function kindOf(label: string, typeStated: boolean) {
  return typeStated ? label : NOT_STATED;
}

const entries: DirectoryEntry[] = publicInstitutions.map((institution) => {
  const kinds = [
    ...new Set(
      institution.rows.map((row) => kindOf(publicAgreementLabel(row), row.type !== "not-stated")),
    ),
  ];
  const stated = kinds.filter((kind) => kind !== NOT_STATED);
  const detail = !institution.inPartnerTable
    ? `Named on the Global Programs page · ${institution.programmes.map((p) => p.programName).join(", ")}`
    : [
        institution.country,
        institution.rows.length > 1 ? `${institution.rows.length} entries on the official page` : null,
        stated.length > 0 ? stated.join(", ") : null,
      ]
        .filter(Boolean)
        .join(" · ");
  return {
    slug: institution.slug,
    name: institution.name,
    listedName: institution.listedName,
    country: institution.country,
    region: institution.region,
    agreementKinds: kinds,
    detail,
  };
});

const agreementKinds = [
  ...new Set(entries.flatMap((entry) => entry.agreementKinds).filter((kind) => kind !== NOT_STATED)),
].sort();
agreementKinds.push(NOT_STATED);

export default function PartnersPage() {
  return (
    <article className="pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Partner universities"
          title="Institutions MUJ lists as international collaborations."
          lede={`${officialStats.institutions} institutions in ${officialStats.countries} countries, from ${officialStats.collaborationRows} entries on the official International Collaborations page. Filter by region, country, or the agreement wording the page uses, or search by name.`}
          meta={`Source checked ${SOURCE_REVIEWED_ON}`}
        />
        <p className="mt-6 max-w-2xl border-l border-line-bold pl-4 text-sm leading-6 text-muted-foreground">
          Names are shown in normalised spelling; each entry keeps the name exactly as listed.
          The official page does not state agreement status, dates, or which programmes are open
          at each institution, so neither does this directory. Source:{" "}
          <a
            href={officialSources.partners.url}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:text-foreground hover:underline"
          >
            {officialSources.partners.title}
          </a>
          .
        </p>
        <PartnerDirectory
          institutions={entries}
          regions={publicRegions}
          agreementKinds={agreementKinds}
        />
        <StudyPath current="/student-portal/partners" />
      </Container>
    </article>
  );
}
