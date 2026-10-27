import { BookMarked, Globe, Trophy } from "lucide-react";
import { SourceLink, VerificationBadge } from "@/components/internal/ui/provenance";
import type { RegisterAccess, RegisterRow } from "@/lib/internal/data/register";
import { formatDate } from "@/lib/internal/dates";
import { sourceMeta, verificationMeta } from "@/lib/internal/status";
import type { Provenance } from "@/lib/internal/types";
import { sheetLabels } from "@/lib/internal/workbook/source";
import { qs2027ForInstitution } from "@/lib/official/qs-rankings-2027";

const QS_URL = "https://www.topuniversities.com/world-university-rankings";

type Source = {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
};

/** Where each part of a university's record comes from, one source per row. */
export function UniversityProvenance({
  institution,
  rows,
  register,
}: {
  institution: Provenance & { id: string; source: keyof typeof sourceMeta };
  /** Every register row for the university, across its agreements. */
  rows: readonly RegisterRow[];
  register: RegisterAccess;
}) {
  const qs = qs2027ForInstitution(institution.id);
  const bySheet = new Map<string, number[]>();
  for (const row of rows) {
    const label = sheetLabels[row.sheet];
    bySheet.set(label, [...(bySheet.get(label) ?? []), row.excelRow]);
  }
  const workbook = rows[0]?.workbook ?? "MoU details.xlsx";

  const sources: Source[] = [
    {
      key: "record",
      icon: Globe,
      title: sourceMeta[institution.source].label,
      children: (
        <>
          {institution.sourceUrl ? (
            <SourceLink url={institution.sourceUrl} title={institution.sourceTitle} />
          ) : (
            <span>{institution.sourceTitle ?? sourceMeta[institution.source].description}</span>
          )}
          <span className="block text-fg-faint">
            {institution.sourceCheckedOn ? `Checked ${formatDate(institution.sourceCheckedOn)}` : "Check date not recorded"}
          </span>
        </>
      ),
    },
    {
      key: "register",
      icon: BookMarked,
      title: "DoIC MoU register",
      children:
        bySheet.size > 0 ? (
          <>
            <span>{workbook}: dates, period, status, faculty, department, and scope.</span>
            <ul className="mt-1 space-y-0.5 text-fg-faint">
              {[...bySheet].map(([sheet, numbers]) => (
                <li key={sheet}>
                  {sheet}: row{numbers.length > 1 ? "s" : ""} {numbers.sort((a, b) => a - b).join(", ")}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <span className="text-fg-faint">
            {register.state === "granted" ? "No register row names this university." : "Register rows are restricted."}
          </span>
        ),
    },
    {
      key: "qs",
      icon: Trophy,
      title: "QS World University Rankings 2027",
      children: qs ? (
        <>
          <span>
            Rank {qs.rank}, listed as &ldquo;{qs.qsName}&rdquo;.
          </span>
          <span className="block text-fg-faint">
            Published 18 June 2026 · <SourceLink url={QS_URL} title="topuniversities.com" />
          </span>
        </>
      ) : (
        <span className="text-fg-faint">Not in the 2027 table, so no rank is shown.</span>
      ),
    },
  ];

  return (
    <div className="space-y-4 px-4 sm:px-6 pb-5">
      <div className="flex flex-col items-start gap-1.5 rounded-xl border border-hairline bg-overlay-subtle px-3 py-2.5">
        <VerificationBadge status={institution.verification} />
        <p className="text-[12px] leading-relaxed text-fg-subtle">{verificationMeta[institution.verification].description}</p>
      </div>
      <ol className="space-y-4">
        {sources.map(({ key, icon: Icon, title, children }) => (
          <li key={key} className="flex min-w-0 gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg-subtle">
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-[12.5px] leading-relaxed [overflow-wrap:anywhere] text-fg-soft">
              <p className="text-[11px] font-medium tracking-[0.12em] text-fg-faint uppercase">{title}</p>
              <div className="mt-0.5">{children}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
