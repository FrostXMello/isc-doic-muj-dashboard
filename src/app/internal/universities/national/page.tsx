import type { Metadata } from "next";
import { Landmark, Lock } from "lucide-react";
import { RecordedText, RegisterNotice } from "@/components/internal/university-register";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { loadRegister } from "@/lib/internal/data/register";
import { sheetLabel } from "@/lib/internal/register-view";
import { displayCell, displayHeaders, fieldLabel } from "@/lib/internal/workbook/source";

export const metadata: Metadata = { title: "National collaborations" };

const NAME = "National Collaborations";
const YEAR = "Year";

/** The register's National MoUs sheet: Indian partners, kept apart from the international universities. */
export default async function NationalCollaborationsPage() {
  const register = await loadRegister();
  const rows = register.state === "granted" ? register.rows.filter((row) => row.sheet === "national-mous") : [];

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/universities"
        backLabel="Universities & MoUs"
        eyebrow="DoIC MoU register"
        title="National collaborations"
        subtitle="Agreements with Indian institutions from the register's National MoUs sheet, as recorded."
      />
      <DetailSection title={`Recorded collaborations (${rows.length})`} icon={Landmark}>
        {register.state !== "granted" ? (
          <EmptyState compact icon={Lock} title="Not available" description={<RegisterNotice register={register} />} />
        ) : rows.length === 0 ? (
          <EmptyState compact title="No national collaborations recorded" />
        ) : (
          <ol className="divide-y divide-hairline border-t border-hairline">
            {rows.map((row) => {
              const name = displayCell(NAME, row.values, row.formulas);
              const year = displayCell(YEAR, row.values, row.formulas);
              const extra = displayHeaders(row.values, row.formulas).filter((header) => header !== NAME && header !== YEAR);
              return (
                <li key={row.importKey} className="flex flex-col gap-1 px-6 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="min-w-0 flex-1 text-[14px] text-foreground">
                    {name && name.kind !== "withheld" ? (
                      <RecordedText value={name.text} />
                    ) : (
                      <span className="text-fg-faint">Name not recorded</span>
                    )}
                    {extra.map((header) => {
                      const cell = displayCell(header, row.values, row.formulas);
                      return cell ? (
                        <span key={header} className="block text-[12px] text-muted-foreground">
                          {fieldLabel(header)}:{" "}
                          {cell.kind === "withheld" ? "formula output withheld" : <RecordedText value={cell.text} />}
                        </span>
                      ) : null;
                    })}
                  </span>
                  <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                    {year && year.kind !== "withheld" ? year.text : <span className="text-fg-faint">Year not recorded</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-fg-faint">{sheetLabel(row)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </DetailSection>
    </div>
  );
}
