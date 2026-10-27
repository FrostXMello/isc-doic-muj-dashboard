import { ExternalLink, FileText, Mail, Phone, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { AgreementStatusBadge } from "@/components/internal/badges";
import { StatusBadge } from "@/components/internal/ui/status-badge";
import type { AgreementDetails, RegisterAccess, RegisterRow } from "@/lib/internal/data/register";
import { formatDate, formatRelativeDays } from "@/lib/internal/dates";
import { EXPIRY_LEGEND, type ExpirySummary } from "@/lib/internal/expiry";
import {
  type AgreementEntry,
  type ContactView,
  type OfficerView,
  sheetLabel,
  type UniversityEntry,
} from "@/lib/internal/register-view";
import { agreementTypeLabel } from "@/lib/internal/status";
import { qs2027ForInstitution } from "@/lib/official/qs-rankings-2027";
import {
  displayCell,
  displayHeaders,
  fieldLabel,
  isPlaceholder,
  mouList,
  STATUS_NAME_COLUMN,
  workflowColumns,
} from "@/lib/internal/workbook/source";
import { cn } from "@/lib/utils";

/**
 * DoIC MoU register presentation, shared by the Universities & MoUs list and
 * the university page. Only values that exist are shown; placeholders such
 * as "NA" are shown as written and marked, and formula output is withheld.
 */

const linkClass = "text-muj-fg underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm";
const HTTPS = /^https:\/\/\S+$/i;

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

/** A recorded value: placeholders marked as such, https links clickable. */
export function RecordedText({ value }: { value: string }) {
  if (isPlaceholder(value)) {
    return (
      <span className="text-fg-subtle">
        {value.trim()} <span className="text-[11px] text-fg-faint">(as recorded)</span>
      </span>
    );
  }
  if (HTTPS.test(value.trim())) {
    return (
      <a href={value.trim()} target="_blank" rel="noreferrer" className={cn(linkClass, "break-all")}>
        {value.trim()}
        <ExternalLink className="ml-1 inline size-3" aria-hidden />
      </a>
    );
  }
  return <span className="whitespace-pre-line">{value}</span>;
}

export type Fact = { label: string; value: React.ReactNode; wide?: boolean };

/** Compact label/value grid. Callers pass only facts that have values. */
export function Facts({ items, className }: { items: readonly (Fact | null | false | undefined)[]; className?: string }) {
  const present = items.filter((item): item is Fact => Boolean(item));
  if (present.length === 0) return null;
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {present.map((item) => (
        <div key={item.label} className={cn("min-w-0", item.wide && "sm:col-span-2 xl:col-span-3")}>
          <dt className="text-[10.5px] font-medium tracking-[0.12em] text-fg-faint uppercase">{item.label}</dt>
          <dd className="mt-0.5 text-[13px] leading-relaxed break-words text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

const fact = (label: string, value: string | null | undefined, wide = false): Fact | null =>
  value && value.trim() ? { label, value: <RecordedText value={value} />, wide } : null;

/** People with clickable numbers and addresses. */
export function OfficerList({
  officers,
  empty = "Not recorded",
  compact = false,
}: {
  officers: readonly OfficerView[] | null;
  empty?: string;
  compact?: boolean;
}) {
  if (officers === null) return <span className="text-fg-faint">Restricted</span>;
  if (officers.length === 0) return <span className="text-fg-faint">{empty}</span>;
  return (
    <ul className={cn("space-y-1.5", compact && "space-y-1")}>
      {officers.map((officer) => (
        <li key={officer.key} className="min-w-0">
          <span className="block text-foreground">
            {officer.name ?? <span className="text-fg-faint">Name not recorded</span>}
          </span>
          {officer.phones.length > 0 || officer.emails.length > 0 ? (
            <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px]">
              {officer.phones.map((phone) => (
                <a key={phone} href={telHref(phone)} className={cn(linkClass, "inline-flex items-center gap-1 whitespace-nowrap")}>
                  <Phone className="size-3" aria-hidden />
                  {phone}
                </a>
              ))}
              {officer.emails.map((email) => (
                <a key={email} href={`mailto:${email}`} className={cn(linkClass, "inline-flex min-w-0 items-center gap-1 break-all")}>
                  <Mail className="size-3 shrink-0" aria-hidden />
                  {email}
                </a>
              ))}
            </span>
          ) : (
            <span className="block text-[12px] text-fg-faint">No phone or email recorded</span>
          )}
          {!compact && officer.notes.length > 0 ? (
            <span className="mt-0.5 block text-[12px] text-fg-subtle">{officer.notes.join(" · ")}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function ContactRows({ contacts }: { contacts: readonly ContactView[] }) {
  return (
    <ul className="space-y-1.5">
      {contacts.map((contact) => (
        <li key={contact.id}>
          <span className="block text-[11px] text-fg-faint">{contact.roleLabel}</span>
          <OfficerList
            officers={[
              {
                key: contact.id,
                name: contact.name,
                phones: contact.phone ? [contact.phone] : [],
                emails: contact.email ? [contact.email] : [],
                notes: contact.note ? [contact.note] : [],
                agreementIds: [],
              },
            ]}
          />
        </li>
      ))}
    </ul>
  );
}

export function ExpiryIndicator({ expiry, compact = false }: { expiry: ExpirySummary; compact?: boolean }) {
  if (expiry.kind !== "dated") {
    return (
      <span className="text-[13px] text-fg-faint">
        {expiry.kind === "open-ended" ? "No end date recorded" : "Not recorded"}
        {expiry.others > 0 ? <span className="block text-[11px]">{expiry.others + 1} agreements</span> : null}
      </span>
    );
  }
  return (
    <span className="flex flex-col items-start gap-0.5">
      <StatusBadge label={formatDate(expiry.endDate)} tone={expiry.tone} title={expiry.label} />
      <span className="text-[11px] text-fg-faint">
        {expiry.label} · {expiry.days < 0 ? "ended" : "ends"} {formatRelativeDays(expiry.days)}
        {expiry.others > 0 ? ` · +${expiry.others} more` : ""}
      </span>
      {expiry.review ? (
        <span className="inline-flex items-start gap-1 text-[11px] text-warning-fg" title={expiry.review}>
          <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden />
          {compact ? "Needs review" : expiry.review}
        </span>
      ) : null}
    </span>
  );
}

export function ExpiryLegend() {
  return (
    <ul aria-label="Expiry colours" className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-fg-subtle">
      {EXPIRY_LEGEND.map((entry) => (
        <li key={entry.label} className="flex items-center gap-2">
          <StatusBadge label={entry.label} tone={entry.tone} />
          {entry.description}
        </li>
      ))}
      <li className="flex items-center gap-1.5 text-warning-fg">
        <TriangleAlert className="size-3.5" aria-hidden />
        register and dates disagree — needs review
      </li>
    </ul>
  );
}

/** Every displayable cell of a worksheet row, minus `skip`. */
export function RegisterRowFields({ row, skip = [] }: { row: RegisterRow; skip?: readonly string[] }) {
  const skipped = new Set(skip);
  const items: Fact[] = displayHeaders(row.values, row.formulas)
    .filter((header) => !skipped.has(header))
    .flatMap((header) => {
      const cell = displayCell(header, row.values, row.formulas);
      if (!cell) return [];
      const value =
        cell.kind === "withheld" ? (
          <span className="text-fg-faint">Formula output withheld</span>
        ) : (
          <RecordedText value={cell.text} />
        );
      return [{ label: fieldLabel(header), value }];
    });
  return <Facts items={items} />;
}

function RowIssues({ rows }: { rows: readonly RegisterRow[] }) {
  const issues = rows.flatMap((row) => row.issues.map((issue) => ({ key: `${row.importKey}-${issue}`, row, issue })));
  if (issues.length === 0) return null;
  return (
    <ul className="space-y-1 text-[12px] text-warning-fg">
      {issues.map(({ key, row, issue }) => (
        <li key={key} className="flex items-start gap-1.5">
          <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
          <span>
            {issue} <span className="text-fg-faint">({sheetLabel(row)})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Processing milestones from the MoU Status sheet, in workflow order. */
export function WorkflowMilestones({ row }: { row: RegisterRow }) {
  const steps = workflowColumns.flatMap((header) => {
    const cell = displayCell(header, row.values, row.formulas);
    return cell ? [{ header, cell }] : [];
  });
  return (
    <div className="space-y-2">
      {steps.length > 0 ? (
        <ol className="flex flex-wrap gap-1.5">
          {steps.map(({ header, cell }) => (
            <li
              key={header}
              className="max-w-full rounded-full border border-line-strong px-2.5 py-0.5 text-[11.5px] [overflow-wrap:anywhere] text-fg-soft"
            >
              <span className="text-fg-faint">{fieldLabel(header)}:</span>{" "}
              {cell.kind === "withheld" ? "formula output withheld" : cell.text}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[12px] text-fg-faint">No milestones recorded.</p>
      )}
      <RegisterRowFields row={row} skip={[...workflowColumns, STATUS_NAME_COLUMN]} />
    </div>
  );
}

/** MoU list columns already shown as typed agreement, detail, or contact fields. */
const listColumnsShownElsewhere = [
  mouList.reference,
  mouList.name,
  mouList.year,
  mouList.period,
  mouList.signing,
  mouList.expiry,
  mouList.renewalYear,
  mouList.qs,
  mouList.the,
  mouList.status,
  mouList.nodal,
  mouList.revisedNodal,
  mouList.faculty,
  mouList.department,
  mouList.nodalEmail,
  mouList.nodalPhone,
  mouList.opportunities,
  mouList.partner,
  mouList.partnerEmail,
  mouList.partnerPhone,
  mouList.country,
  mouList.programme,
  mouList.remarks,
];

function DocumentLinks({ details, rows }: { details: AgreementDetails | null; rows: readonly RegisterRow[] }) {
  const files = rows.flatMap((row) => {
    const cell = displayCell("MoU Link", row.values, row.formulas);
    return cell && cell.kind === "value" && !HTTPS.test(cell.text) ? [{ row, name: cell.text }] : [];
  });
  if (!details?.documentUrl && files.length === 0) return null;
  return (
    <ul className="space-y-1 text-[13px]">
      {details?.documentUrl ? (
        <li>
          <a href={details.documentUrl} target="_blank" rel="noreferrer" className={cn(linkClass, "inline-flex items-center gap-1.5")}>
            <FileText className="size-3.5" aria-hidden />
            Agreement file on DoIC SharePoint
            <ExternalLink className="size-3" aria-hidden />
          </a>
          <span className="block text-[11px] text-fg-faint">Opens only for MUJ accounts with access to the DoIC folder.</span>
        </li>
      ) : null}
      {files.map(({ row, name }) => (
        <li key={row.importKey} className="text-fg-soft">
          <FileText className="mr-1.5 inline size-3.5 text-fg-faint" aria-hidden />
          {name}
          <span className="block text-[11px] text-fg-faint">
            File named in the register ({sheetLabel(row)}); not uploaded to the portal.
          </span>
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium tracking-[0.14em] text-fg-faint uppercase">{children}</p>;
}

/** Everything recorded for one agreement, kept separate from the university's other agreements. */
export function AgreementRegisterFacts({ entry, showHeading = true }: { entry: AgreementEntry; showHeading?: boolean }) {
  const { agreement, details, rows } = entry;
  const listRow = rows.list[0];
  return (
    <div className="space-y-4">
      {showHeading ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-foreground">{agreement.title}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {agreement.typeLabel ?? agreementTypeLabel[agreement.type]} ·{" "}
              <span className="font-mono">{agreement.reference}</span>
            </p>
          </div>
          <AgreementStatusBadge status={agreement.status} daysToExpiry={agreement.daysToExpiry} />
        </div>
      ) : null}

      {entry.review ? (
        <p className="flex items-start gap-2 rounded-xl border-l-2 border-warning bg-warning/[0.07] px-3 py-2 text-[12px] text-warning-fg">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {entry.review}
        </p>
      ) : null}

      <Facts
        items={[
          fact("DoIC reference", details?.doicReference),
          agreement.startDate ? { label: "Signed", value: formatDate(agreement.startDate) } : null,
          details?.initiationYear ? { label: "Year of initiation", value: String(details.initiationYear) } : null,
          fact("Period", details?.periodText),
          agreement.endDate
            ? {
                label: "Expiry",
                value: (
                  <span>
                    {formatDate(agreement.endDate)}
                    {agreement.daysToExpiry !== null ? (
                      <span className="block text-[11px] text-fg-faint">
                        {agreement.daysToExpiry < 0 ? "ended" : "ends"} {formatRelativeDays(agreement.daysToExpiry)}
                      </span>
                    ) : null}
                    {details?.expiryText?.startsWith("Calculated") ? (
                      <span className="block text-[11px] text-fg-faint">{details.expiryText}</span>
                    ) : null}
                  </span>
                ),
              }
            : fact("Expiry", details?.expiryText),
          details?.renewalYear ? { label: "Renewal year", value: String(details.renewalYear) } : null,
          agreement.renewal
            ? { label: "Renewal", value: agreement.renewal === "automatic" ? "Renews automatically" : "Renewed after review" }
            : null,
          fact("Recorded status", details?.recordedStatus),
          fact("QS 2027", qs2027ForInstitution(agreement.institutionId)?.rank ?? details?.qsRanking),
          fact("THE ranking", details?.theRanking),
          fact("Faculty", details?.faculty),
          fact("Department", details?.department),
          fact("Opportunities in the MoU", details?.opportunities, true),
          fact("Summer school or similar programme", details?.programmeReference, true),
          fact("Remarks", details?.remarks, true),
          agreement.collaborationAreas.length > 0
            ? { label: "Collaboration areas", value: agreement.collaborationAreas.join(", "), wide: true }
            : null,
          fact("Notes", agreement.notes, true),
        ]}
      />

      {entry.officers.length > 0 || entry.earlierOfficers.length > 0 || entry.partners.length > 0 || entry.otherContacts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {entry.officers.length > 0 ? (
            <div className="space-y-1.5">
              <SubHeading>DoIC nodal officer</SubHeading>
              <OfficerList officers={entry.officers} />
            </div>
          ) : null}
          {entry.earlierOfficers.length > 0 ? (
            <div className="space-y-1.5">
              <SubHeading>Earlier nodal officer</SubHeading>
              <OfficerList officers={entry.earlierOfficers} />
            </div>
          ) : null}
          {entry.partners.length > 0 ? (
            <div className="space-y-1.5">
              <SubHeading>Partner nodal officer</SubHeading>
              <OfficerList officers={entry.partners} />
            </div>
          ) : null}
          {entry.otherContacts.length > 0 ? (
            <div className="space-y-1.5">
              <SubHeading>Other contacts</SubHeading>
              <ContactRows contacts={entry.otherContacts} />
            </div>
          ) : null}
        </div>
      ) : null}

      <DocumentLinks details={details} rows={rows.link} />

      {rows.status.map((row) => (
        <div key={row.importKey} className="space-y-1.5">
          <SubHeading>Processing workflow · {sheetLabel(row)}</SubHeading>
          <WorkflowMilestones row={row} />
        </div>
      ))}

      {rows.renewal.map((row) => (
        <div key={row.importKey} className="space-y-1.5">
          <SubHeading>Renewal record · {sheetLabel(row)}</SubHeading>
          <RegisterRowFields row={row} skip={[mouList.name]} />
        </div>
      ))}

      {listRow ? <RegisterRowFields row={listRow} skip={listColumnsShownElsewhere} /> : null}

      <RowIssues rows={[...rows.list, ...rows.status, ...rows.renewal, ...rows.link]} />

      {[...rows.list, ...rows.status, ...rows.renewal, ...rows.link].length > 0 ? (
        <p className="text-[11px] text-fg-faint">
          Source: {[...rows.list, ...rows.status, ...rows.renewal, ...rows.link].map(sheetLabel).join(", ")} of the DoIC
          MoU register.
        </p>
      ) : null}
    </div>
  );
}

/** Register rows tied to the university but to no single agreement. */
export function UniversityRegisterRows({ rows }: { rows: readonly RegisterRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.importKey} className="space-y-1.5">
          <SubHeading>
            {sheetLabel(row)}
            {row.matchNote ? <span className="ml-1 tracking-normal normal-case"> — {row.matchNote}</span> : null}
          </SubHeading>
          {row.sheet === "mou-status" ? (
            <WorkflowMilestones row={row} />
          ) : row.sheet === "mou-link" ? (
            <DocumentLinks details={null} rows={[row]} />
          ) : (
            <RegisterRowFields row={row} skip={[mouList.name]} />
          )}
          <RowIssues rows={[row]} />
        </div>
      ))}
    </div>
  );
}

/** What the MoUs cover, for the list's collapsed row; full text is in the details. */
export function ScopeSummary({ entry }: { entry: UniversityEntry }) {
  const [scope, ...moreScopes] = entry.scopes;
  const [programme, ...morePrograms] = entry.programmes;
  if (!scope && !programme) return <span className="text-[13px] text-fg-faint">Not recorded</span>;
  return (
    <span className="flex flex-col gap-1 text-[13px] text-foreground">
      {scope ? (
        <span title={scope} className="line-clamp-3 whitespace-pre-line">
          {scope}
        </span>
      ) : null}
      {moreScopes.length > 0 ? (
        <span className="text-[11px] text-fg-faint">+{moreScopes.length} more in details</span>
      ) : null}
      {programme ? (
        <span className="line-clamp-2 text-[12px] text-muted-foreground">
          Programme: <RecordedText value={programme} />
          {morePrograms.length > 0 ? <span className="text-fg-faint"> +{morePrograms.length}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

/** MUJ department and faculty the MoUs were signed from. */
export function DepartmentSummary({ entry }: { entry: UniversityEntry }) {
  if (entry.departments.length === 0 && entry.faculties.length === 0) {
    return <span className="text-[13px] text-fg-faint">Not recorded</span>;
  }
  return (
    <span className="flex flex-col gap-0.5 text-[13px] text-foreground">
      {entry.departments.length > 0 ? <span>{entry.departments.join(" · ")}</span> : null}
      {entry.faculties.length > 0 ? (
        <span className="text-[12px] text-muted-foreground">{entry.faculties.join(" · ")}</span>
      ) : null}
    </span>
  );
}

export function RegisterNotice({ register }: { register: RegisterAccess }) {
  if (register.state === "granted") return null;
  const text =
    register.reason === "not-migrated"
      ? "The DoIC MoU register has not been imported into this database yet, so register details (references, dates, rankings, earlier and partner officers, workflow) are not shown."
      : register.reason === "static-source"
        ? "This deployment reads the static official dataset, which has no DoIC register details or contacts."
        : "Register details and contacts are internal to DoIC roles.";
  return <span className="block text-[12px] text-fg-faint">{text}</span>;
}

export function UniversityLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/internal/universities/${id}`} className={linkClass}>
      {children}
    </Link>
  );
}
