import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";

export const metadata: Metadata = {
  title: "Student Portal",
  description:
    "Orientation for MUJ students considering international study. Sign-in and applications are not part of this stage.",
};

export default function StudentPortalPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Student portal"
          title="Start here, then read outward."
          lede="This is an orientation for students at Manipal University Jaipur. Explore what is described, understand what a programme means here, compare sample institutions, then find the office. It does not sign you in, and it does not take an application."
          meta="Orientation"
        />

        <StudyPath label="Explore, understand, compare, contact" />

        <section aria-labelledby="not-here" className="mt-14 max-w-3xl">
          <h2
            id="not-here"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            Not on this page.
          </h2>
          <dl className="mt-4 border-t border-white/10">
            <Fact label="Sign-in">
              <Unpublished note="There is no account on this stage." />
            </Fact>
            <Fact label="Applications">
              <Unpublished note="Nothing here is submitted, stored, or treated as interest." />
            </Fact>
            <Fact label="Eligibility, fees, deadlines">
              <Unpublished />
            </Fact>
          </dl>
        </section>
      </Container>
    </article>
  );
}
