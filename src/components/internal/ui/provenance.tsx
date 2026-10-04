import { ArrowUpRight, Lock, UserRound } from "lucide-react";
import { DetailSection, type KeyValueItem } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { NotRecorded } from "@/components/internal/ui/page-header";
import { StatusBadge } from "@/components/internal/ui/status-badge";
import type { ContactAccess } from "@/lib/internal/data/context";
import { formatDate } from "@/lib/internal/dates";
import { verificationMeta } from "@/lib/internal/status";
import type { Provenance, VerificationStatus } from "@/lib/internal/types";

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const meta = verificationMeta[status];
  return <StatusBadge label={meta.label} tone={meta.tone} title={meta.description} />;
}

export function SourceLink({ url, title }: { url: string; title: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-muj-fg underline-offset-4 hover:text-foreground hover:underline"
    >
      {title ?? url}
      <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
    </a>
  );
}

/** Key–value rows describing where a record came from. */
export function provenanceItems(record: Provenance): KeyValueItem[] {
  return [
    {
      label: "Source",
      wide: true,
      value: record.sourceUrl ? (
        <SourceLink url={record.sourceUrl} title={record.sourceTitle} />
      ) : (
        <NotRecorded />
      ),
    },
    {
      label: "Source last checked",
      value: record.sourceCheckedOn ? formatDate(record.sourceCheckedOn) : <NotRecorded />,
    },
    {
      label: "Verification",
      value: (
        <span className="flex flex-col items-start gap-1">
          <VerificationBadge status={record.verification} />
          <span className="text-[12px] text-fg-faint">
            {verificationMeta[record.verification].description}
          </span>
        </span>
      ),
    },
  ];
}

export const RESTRICTED_CONTACTS = "Restricted — available to signed-in DoIC staff";

/**
 * Nodal contacts. Details render only when the server granted access
 * (Supabase source + internal role); otherwise nothing but the notice is sent.
 */
export function ContactsPanel({
  access,
  institutionId,
  agreementId,
}: {
  access: ContactAccess;
  institutionId: string;
  agreementId?: string;
}) {
  if (access.state === "restricted") {
    return (
      <DetailSection title="Nodal contacts" icon={Lock}>
        <EmptyState
          compact
          icon={Lock}
          title={RESTRICTED_CONTACTS}
          description={
            access.reason === "static-source"
              ? "Contacts are stored only in the access-controlled database. This deployment reads the static official dataset, which carries no contact details."
              : "Your account does not hold an internal DoIC role."
          }
        />
      </DetailSection>
    );
  }

  const contacts = access.contacts.filter(
    (row) =>
      row.institutionId === institutionId && (!agreementId || row.agreementId === agreementId),
  );
  return (
    <DetailSection
      title="Nodal contacts"
      icon={UserRound}
      description="Internal only. From the official partner page; do not publish."
    >
      {contacts.length === 0 ? (
        <EmptyState compact title="No contact recorded" />
      ) : (
        <ul className="divide-y divide-hairline">
          {contacts.map((row) => (
            <li key={row.id} className="px-6 py-4 text-[13px]">
              <p className="text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">
                {row.roleLabel}
              </p>
              <p className="mt-1 text-foreground">{row.name ?? <NotRecorded />}</p>
              <p className="mt-0.5 text-muted-foreground">
                {row.email ? <a href={`mailto:${row.email}`} className="hover:text-foreground">{row.email}</a> : null}
                {row.email && row.phone ? " · " : null}
                {row.phone}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DetailSection>
  );
}
