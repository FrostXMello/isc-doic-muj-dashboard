import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, PageIntro, Unpublished } from "@/components/page-intro/page-intro";
import { StudyPath } from "@/components/study-path/study-path";
import { opportunities } from "@/lib/data";
import Link from "next/link";

const audience: Record<(typeof opportunities)[number]["id"], string> = {
  "student-exchange":
    "The published note describes time away with a place held for the return to MUJ. It does not name a school or a year.",
  "semester-exchange":
    "The published note is for students who want a single focused term.",
  "pathway-programs":
    "The published note connects study at MUJ with a later stage at a partner institution. It does not name that institution.",
  "academic-visits":
    "The published note covers faculty-led visits, summer schools, and delegations between Jaipur and campuses abroad.",
};

export const metadata: Metadata = {
  title: "Opportunities",
  description:
    "Student exchange, semester exchange, pathway programs, and academic visits, as described for DoIC. Eligibility, fees, and deadlines are not published.",
};

export default function OpportunitiesPage() {
  return (
    <article className="pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <PageIntro
          eyebrow="Opportunities"
          title="Ways to study beyond Jaipur."
          lede="Four descriptions, and nothing beyond them. Eligibility, fees, deadlines, availability, and a named destination are not published yet."
          meta="Descriptions only"
        />

        <nav aria-label="Opportunity types" className="mt-10 border-t border-white/10">
          <ol>
            {opportunities.map((item, index) => (
              <li key={item.id} className="border-b border-white/10">
                <Link
                  href={`#${item.id}`}
                  className="grid min-h-11 grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 py-3 sm:px-2"
                >
                  <span className="font-mono text-[12px] tracking-[0.14em] text-[#7f93ab]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[1.25rem] tracking-[-0.03em] text-foreground">
                    {item.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12">
          {opportunities.map((item, index) => (
            <section
              key={item.id}
              id={item.id}
              aria-labelledby={`${item.id}-title`}
              className="scroll-mt-28 border-t border-white/10 py-8 sm:py-10"
            >
              <p className="font-mono text-[12px] tracking-[0.16em] text-[#7f93ab]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h2
                id={`${item.id}-title`}
                className="mt-3 font-display text-[clamp(1.6rem,3vw,2.15rem)] leading-tight tracking-[-0.03em] text-foreground"
              >
                {item.title}
              </h2>
              <dl className="mt-4 max-w-3xl">
                <Fact label="What is this?">{item.summary}</Fact>
                <Fact label="Who is it generally for?">{audience[item.id]}</Fact>
                <Fact label="Eligibility">
                  <Unpublished />
                </Fact>
                <Fact label="What destination information exists?">
                  <Unpublished note="No institution is linked to this description. The directory is a separate list of sample names." />
                </Fact>
                <Fact label="Fees, deadlines, availability">
                  <Unpublished />
                </Fact>
                <Fact label="What can I do next?">
                  <span className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-6">
                    <Link
                      href="/partners"
                      className="inline-flex min-h-11 items-center text-[#d7e4fb] hover:text-foreground"
                    >
                      Compare institutions
                    </Link>
                    <Link
                      href="/about"
                      className="inline-flex min-h-11 items-center text-[#d7e4fb] hover:text-foreground"
                    >
                      Contact DoIC
                    </Link>
                    <Link
                      href="/student-portal"
                      className="inline-flex min-h-11 items-center text-[#d7e4fb] hover:text-foreground"
                    >
                      Student orientation
                    </Link>
                  </span>
                </Fact>
              </dl>
            </section>
          ))}
        </div>

        <StudyPath current="/opportunities" label="Where this sits" />
      </Container>
    </article>
  );
}
