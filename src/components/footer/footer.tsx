import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/container";
import { contact, legalNav, portalNav, primaryNav, site } from "@/lib/data";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-sunken">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {site.directorate} at {site.university}. {site.managedBy}.
            </p>
            <p className="mt-4 max-w-sm text-[12px] leading-relaxed text-muted-foreground/80">
              This is not the official MUJ website. Partner and programme information is taken from{" "}
              <a
                href={site.officialSite}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-line-bold underline-offset-4 hover:text-foreground"
              >
                jaipur.manipal.edu
              </a>
              , which remains the authoritative source.
            </p>
          </div>
          <nav className="md:col-span-3" aria-label="Footer">
            <p className="text-[11px] tracking-[0.18em] text-cyan uppercase">Navigate</p>
            <ul className="mt-4 space-y-2.5">
              {[...primaryNav, ...portalNav].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-4">
            <p className="text-[11px] tracking-[0.18em] text-cyan uppercase">Contact</p>
            <p className="mt-4 text-sm text-foreground">{contact.office}</p>
            <p className="text-sm text-muted-foreground">{contact.location}</p>
            <address className="mt-3 text-sm leading-relaxed text-muted-foreground not-italic">
              {contact.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <a
                href={`mailto:${contact.email}`}
                className="mt-3 block text-foreground underline decoration-line-bold underline-offset-4 hover:decoration-cyan"
              >
                {contact.email}
              </a>
              <span className="block">{contact.telephone}</span>
            </address>
          </div>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-5 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.university}. {site.managedBy}.
          </p>
          <ul className="flex gap-4">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
