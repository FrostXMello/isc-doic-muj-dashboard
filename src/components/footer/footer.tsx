import { Wordmark } from "@/components/brand/wordmark";
import { Container } from "@/components/container";
import { contact, legalNav, portalNav, primaryNav, site } from "@/lib/data";
import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-[#060910]">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Wordmark />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {site.directorate} at {site.university}. {site.managedBy}.
            </p>
            <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground/80">
              Figures and institution names on this site are illustrative previews.
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
            <p className="text-sm text-muted-foreground">{contact.cell}</p>
            <address className="mt-3 text-sm leading-relaxed text-muted-foreground not-italic">
              {contact.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 text-sm text-muted-foreground">{contact.note}</p>
          </div>
        </div>
      </Container>
      <div className="border-t border-white/10">
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
