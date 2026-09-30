import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "This stage of the DoIC site collects no personal information. A full privacy notice is not published yet.",
};

export default function PrivacyPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Privacy"
          title="What this site does, and what it does not."
          lede="This stage of the Directorate of International Collaboration site stores nothing, runs no analytics, and does not ask you to sign in. A privacy notice is a separate document, and it is not published yet."
        />
        <section aria-labelledby="does" className="mt-10 max-w-3xl">
          <h2
            id="does"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            What this mock site does.
          </h2>
          <dl className="mt-4 border-t border-line">
            <Fact label="Accounts">No sign-in is offered for students or for staff.</Fact>
            <Fact label="Applications">No form submits or stores an application.</Fact>
            <Fact label="Analytics">None run on this stage.</Fact>
          </dl>
        </section>
        <section aria-labelledby="does-not" className="mt-12 max-w-3xl">
          <h2
            id="does-not"
            className="font-display text-[clamp(1.45rem,2.4vw,1.85rem)] tracking-[-0.03em] text-foreground"
          >
            Not published yet.
          </h2>
          <dl className="mt-4 border-t border-line">
            <Fact label="Privacy notice">
              <Unpublished note="What would be collected, why, and how long it would be kept." />
            </Fact>
            <Fact label="Who to ask">
              <Unpublished note="A named contact for privacy questions is not on this site." />
            </Fact>
          </dl>
        </section>
      </Container>
    </article>
  );
}
