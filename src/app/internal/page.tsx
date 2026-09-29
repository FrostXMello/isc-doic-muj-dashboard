import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Fact, Unpublished } from "@/components/page-intro/page-intro";
import { contact, site } from "@/lib/data";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Internal Portal",
  description:
    "An operational outline for DoIC and International Student Cell staff. The workspace is not open and shows no live records.",
};

const areas = [
  {
    index: "01",
    area: "Directory maintenance",
    holds: "A later working list of institutions and countries. The public directory remains the illustrative list.",
  },
  {
    index: "02",
    area: "Partnership records",
    holds: "A file for correspondence with a university. Nothing is stored on this page.",
  },
  {
    index: "03",
    area: "Mobility records",
    holds: "A place for outbound and incoming student files. There is no queue here.",
  },
  {
    index: "04",
    area: "Enquiries",
    holds: "A place for questions that reach the cell. No inbox is connected, and this page cannot send a message.",
  },
] as const;

export default function InternalPortalPage() {
  return (
    <article className="border-t border-white/10 bg-[#080c16] pt-28 pb-20 sm:pt-32 sm:pb-28">
      <Container>
        <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          Staff workspace · {site.shortName}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(1.85rem,3.4vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.035em] text-foreground">
          What the internal side will hold.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-[15px]">
          {contact.office} and {contact.cell}. The rows below are the intended
          areas of a later workspace. The status is the same on every row
          because the workspace is not open. It is not an error, and it is not
          a count.
        </p>
        <p className="mt-5 inline-flex min-h-11 items-center border border-white/20 px-2.5 font-mono text-[11px] tracking-[0.16em] text-[#d7e0ee] uppercase">
          Not in this stage
        </p>

        <div className="mt-8 border-t border-white/10">
          <div className="hidden border-b border-white/10 py-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase md:grid md:grid-cols-[4.5rem_minmax(0,0.75fr)_minmax(0,1.3fr)_10rem] md:gap-6">
            <span>No.</span>
            <span>Area</span>
            <span>Will hold</span>
            <span>Status</span>
          </div>
          <ul>
            {areas.map((item) => (
              <li
                key={item.index}
                className="grid gap-2 border-b border-white/10 py-5 md:grid-cols-[4.5rem_minmax(0,0.75fr)_minmax(0,1.3fr)_10rem] md:items-baseline md:gap-6"
              >
                <span className="font-mono text-[12px] tracking-[0.14em] text-[#7f93ab]">
                  {item.index}
                </span>
                <h2 className="font-display text-[1.2rem] tracking-[-0.03em] text-foreground">
                  {item.area}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.holds}</p>
                <p className="font-mono text-[11px] leading-5 tracking-[0.12em] text-[#c5d4e6] uppercase">
                  Not in this stage
                </p>
              </li>
            ))}
          </ul>
        </div>

        <dl className="mt-10 max-w-3xl border-t border-white/10">
          <Fact label="Agreement status">
            <Unpublished />
          </Fact>
          <Fact label="Staff sign-in">
            <Unpublished note="This page does not ask for a password." />
          </Fact>
          <Fact label="Live records">
            <Unpublished />
          </Fact>
        </dl>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Students should use the{" "}
          <Link
            href="/student-portal"
            className="inline-flex min-h-11 items-center text-[#d7e4fb] hover:text-foreground"
          >
            student orientation
          </Link>
          . The public account of the office is on{" "}
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center text-[#d7e4fb] hover:text-foreground"
          >
            About DoIC
          </Link>
          .
        </p>
      </Container>
    </article>
  );
}
