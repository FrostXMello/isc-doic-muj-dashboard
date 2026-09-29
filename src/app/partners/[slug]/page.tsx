import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import {
  formatCoord,
  getInstitution,
  institutions,
  institutionsInCountry,
  longitudeFromJaipur,
} from "@/lib/directory";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return institutions.map((institution) => ({ slug: institution.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const institution = getInstitution(slug);
  if (!institution) return { title: "Partner" };
  return {
    title: institution.name,
    description: `Illustrative directory entry for ${institution.name} in ${institution.city}. Not a published agreement.`,
  };
}

export default async function PartnerDetailPage({ params }: Props) {
  const { slug } = await params;
  const institution = getInstitution(slug);
  if (!institution) notFound();

  const peers = institutionsInCountry(institution.countryId, institution.slug);

  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <nav aria-label="Breadcrumb">
          <Link
            href="/partners"
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to partners
          </Link>
        </nav>
        <PageIntro
          className="mt-2"
          eyebrow={institution.region}
          title={institution.name}
          lede={`${institution.country} · ${institution.city}. A sample institution on the illustrative network.`}
          meta="Illustrative partner"
        />

        <dl className="mt-10 max-w-3xl border-t border-white/10">
          <Fact label="Region">{institution.region}</Fact>
          <Fact label="Country">{institution.country}</Fact>
          <Fact label="City">{institution.city}</Fact>
          <Fact label="Illustrative coordinates">
            <span className="text-sm text-muted-foreground">
              {formatCoord(institution.lat, "N", "S")},{" "}
              {formatCoord(institution.lon, "E", "W")}
              <span className="text-white/30"> · </span>
              {longitudeFromJaipur(institution.lon)}° of longitude from Jaipur.
              City position only, not a confirmed campus address.
            </span>
          </Fact>
          <Fact label="Agreement status">
            <Unpublished note="These notes do not record an agreement, a memorandum, or a current status." />
          </Fact>
          <Fact label="Programmes at this institution">
            <Unpublished note="No opportunity is linked to this institution. Programme descriptions are separate." />
          </Fact>
          <Fact label="Eligibility, fees, deadlines, availability">
            <Unpublished />
          </Fact>
        </dl>

        <aside className="mt-8 max-w-2xl border-l border-white/15 pl-4">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Country note · illustrative
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {institution.countrySummary}
          </p>
        </aside>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          <Link
            href="/opportunities"
            className="inline-flex min-h-11 items-center text-[#d7e4fb] hover:text-foreground"
          >
            Read opportunity descriptions
          </Link>
        </p>

        <section aria-labelledby="same-country" className="mt-12 max-w-3xl">
          <h2
            id="same-country"
            className="font-display text-[1.35rem] tracking-[-0.03em] text-foreground"
          >
            Other sample institutions in {institution.country}
          </h2>
          {peers.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              No other sample institution is listed for {institution.country}.
            </p>
          ) : (
            <ul className="mt-4 border-t border-white/10">
              {peers.map((peer) => (
                <li key={peer.slug} className="border-b border-white/10">
                  <Link
                    href={`/partners/${peer.slug}`}
                    className="group flex min-h-11 items-center justify-between gap-4 py-4 text-foreground transition-colors hover:text-[#d7e4fb]"
                  >
                    <span>
                      <span className="block font-display text-xl tracking-[-0.03em]">
                        {peer.name}
                      </span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {peer.city}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-[#8ea0b8] motion-safe:group-hover:translate-x-0.5"
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
