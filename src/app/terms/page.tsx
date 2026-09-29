import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms of use for the DoIC site are not published yet. This preview is not an offer of admission or a confirmed partnership.",
};

export default function TermsPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Terms"
          title="What this preview is."
          lede="These pages are a preview of the Directorate of International Collaboration site. They are not an offer of admission, a confirmed partnership, or a completed application. Terms of use are not published yet."
        />
        <section aria-labelledby="shown" className="mt-10 max-w-3xl">
          <h2
            id="shown"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            What the pages actually show.
          </h2>
          <dl className="mt-4 border-t border-white/10">
            <Fact label="Institution names">
              Sample names on an illustrative network. They are not a published
              list of agreements.
            </Fact>
            <Fact label="Counts on the home page">
              Demo figures. They are not official university statistics.
            </Fact>
            <Fact label="Opportunities">
              Short descriptions only. They do not state eligibility, fees,
              deadlines, or availability.
            </Fact>
          </dl>
        </section>
        <section aria-labelledby="rules" className="mt-12 max-w-3xl">
          <h2
            id="rules"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            Not published yet.
          </h2>
          <dl className="mt-4 border-t border-white/10">
            <Fact label="Terms of use">
              <Unpublished note="How the public pages, and later the portals, may be used." />
            </Fact>
          </dl>
        </section>
        <p className="mt-8">
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center text-sm text-[#d7e4fb] hover:text-foreground"
          >
            Privacy
          </Link>
        </p>
      </Container>
    </article>
  );
}
