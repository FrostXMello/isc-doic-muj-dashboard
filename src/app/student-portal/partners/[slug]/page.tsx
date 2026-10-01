import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, NotStated, PageIntro } from "@/components/page-intro/page-intro";
import {
  getPublicInstitution,
  institutionsInCountry,
  publicAgreementLabel,
  publicInstitutions,
} from "@/lib/official/public";
import { SOURCE_REVIEWED_ON } from "@/lib/official/source";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return publicInstitutions.map((institution) => ({ slug: institution.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const institution = getPublicInstitution(slug);
  if (!institution) return { title: "Partner" };
  return {
    title: institution.name,
    description: `${institution.name}, ${institution.country}, as listed on Manipal University Jaipur's official ${institution.sourceTitle} page.`,
  };
}

export default async function PartnerDetailPage({ params }: Props) {
  const { slug } = await params;
  const institution = getPublicInstitution(slug);
  if (!institution) notFound();

  const peers = institutionsInCountry(institution.countryId, institution.slug);

  return (
    <article className="pt-10 pb-20 sm:pt-14 sm:pb-28">
      <Container>
        <nav aria-label="Breadcrumb">
          <Link
            href="/student-portal/partners"
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to partners
          </Link>
        </nav>
        <PageIntro
          className="mt-2"
          eyebrow={`${institution.region} · ${institution.country}`}
          title={institution.name}
          lede={
            institution.inPartnerTable
              ? `Listed on MUJ's official International Collaborations page${
                  institution.rows.length > 1 ? ` in ${institution.rows.length} entries` : ""
                }.`
              : `Named on MUJ's official ${institution.sourceTitle} page. Not listed in the partner table on the International Collaborations page.`
          }
          meta={`Source checked ${SOURCE_REVIEWED_ON}`}
        />

        <p className="mt-6">
          <a
            href={institution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border border-line-bold px-4 text-sm text-foreground transition-colors hover:border-cyan/60"
          >
            Official MUJ source: {institution.sourceTitle}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </p>

        <dl className="mt-10 max-w-3xl border-t border-line">
          <Fact label="Name as listed">{institution.listedName}</Fact>
          <Fact label="Region (as grouped on the source)">{institution.region}</Fact>
          <Fact label="Country">{institution.country}</Fact>
          <Fact label="Website">
            {institution.website ? (
              <a
                href={institution.website}
                target="_blank"
                rel="noreferrer"
                className="break-all text-primary underline-offset-4 hover:text-foreground hover:underline"
              >
                {institution.website}
              </a>
            ) : (
              <NotStated note="No website is linked for this entry on the official page." />
            )}
          </Fact>
          <Fact label="City">
            <NotStated />
          </Fact>
          <Fact label="Agreement status and dates">
            <NotStated note="The official page lists collaborations without status, signing, or expiry dates." />
          </Fact>
          <Fact label="Eligibility, fees, deadlines, availability">
            <NotStated note="Check the programme pages and contact DoIC for current information." />
          </Fact>
        </dl>

        {institution.rows.length > 0 ? (
          <section aria-labelledby="entries" className="mt-12 max-w-3xl">
            <h2
              id="entries"
              className="font-display text-[1.35rem] tracking-[-0.03em] text-foreground"
            >
              Entries on the official partner page
            </h2>
            <ul className="mt-4 border-t border-line">
              {institution.rows.map((row) => (
                <li key={row.reference} className="border-b border-line py-4">
                  <p className="text-foreground">{row.listedAs}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {publicAgreementLabel(row)}
                    <span className="text-fg-dim"> · </span>
                    Listed under {row.sourceSection}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="programmes" className="mt-12 max-w-3xl">
          <h2
            id="programmes"
            className="font-display text-[1.35rem] tracking-[-0.03em] text-foreground"
          >
            Programmes named with this institution
          </h2>
          {institution.programmes.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              The official programme pages do not name a programme with this institution.
            </p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {institution.programmes.map((programme) => (
                <li key={programme.programId} className="border-b border-line py-4">
                  <p className="text-foreground">
                    {programme.programName}
                    {programme.duration ? (
                      <span className="text-muted-foreground"> · {programme.duration}</span>
                    ) : null}
                  </p>
                  {programme.notes ? (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{programme.notes}</p>
                  ) : null}
                  {programme.sourceUrl ? (
                    <a
                      href={programme.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm text-primary hover:text-foreground"
                    >
                      Official source
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="same-country" className="mt-12 max-w-3xl">
          <h2
            id="same-country"
            className="font-display text-[1.35rem] tracking-[-0.03em] text-foreground"
          >
            Other listed institutions in {institution.country}
          </h2>
          {peers.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No other institution in {institution.country} is listed.
            </p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {peers.map((peer) => (
                <li key={peer.slug} className="border-b border-line">
                  <Link
                    href={`/student-portal/partners/${peer.slug}`}
                    className="group flex min-h-11 items-center justify-between gap-4 py-4 text-foreground transition-colors hover:text-primary"
                  >
                    <span className="block font-display text-xl tracking-[-0.03em]">
                      {peer.name}
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground motion-safe:group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Container>
    </article>
  );
}
