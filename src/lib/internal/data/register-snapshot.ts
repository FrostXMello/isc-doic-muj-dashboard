import type { Dataset } from "@/lib/internal/data/dataset";
import type { RegisterScope } from "@/lib/internal/data/current";
import type { AgreementDetails, MatchStatus, RegisterRow } from "@/lib/internal/data/register";
import snapshot from "@/lib/internal/data/register-snapshot.json";
import type { Agreement, AgreementRecordStatus, AgreementType, Institution, Region } from "@/lib/internal/types";
import type { CellValue, SheetKey } from "@/lib/internal/workbook/source";
import { officialCountries, referenceCountries } from "@/lib/official/countries";

/**
 * Non-personal part of the DoIC MoU register (dates, statuses, faculty,
 * department, scope), exported by `npm run db:mou:snapshot`. Overlaid on the
 * dataset so the portal shows it before, and after, the register import runs
 * on the database: it only fills empty dates and a "not stated" status, and
 * only adds universities and agreements the dataset does not already hold.
 */

type SnapshotAgreement = (typeof snapshot.agreements)[number];

const sourceTitle = (row: number) => `DoIC MoU register (${snapshot.source}), MoU list row ${row}`;

const countries = new Map<string, { name: string; region: string | null }>([
  ...[...officialCountries, ...referenceCountries].map((country) => [country.id, country] as const),
  ...snapshot.countries.map((country) => [country.slug, country] as const),
]);

function toAgreement(row: SnapshotAgreement): Agreement {
  return {
    id: row.code,
    reference: row.reference,
    institutionId: row.institutionSlug,
    title: row.title,
    type: row.type as AgreementType,
    typeLabel: row.typeLabel,
    recordStatus: (row.recordStatus as AgreementRecordStatus | null) ?? "not-stated",
    startDate: row.startDate,
    endDate: row.endDate,
    renewal: null,
    collaborationAreas: [],
    sourceSection: null,
    notes: null,
    source: "official",
    sourceUrl: null,
    sourceTitle: sourceTitle(row.excelRow),
    sourceCheckedOn: null,
    verification: row.needsReview ? "needs-review" : "source-imported",
  };
}

export function withRegisterSnapshot(base: Dataset): Dataset {
  const byCode = new Map(snapshot.agreements.map((row) => [row.code, row]));
  const institutionIds = new Set(base.institutions.map((row) => row.id));
  const agreementIds = new Set(base.agreements.map((row) => row.id));

  const institutions: Institution[] = snapshot.institutions.flatMap((row) => {
    const country = countries.get(row.countryId);
    if (institutionIds.has(row.slug) || !country?.region) return [];
    return [
      {
        id: row.slug,
        name: row.name,
        normalizedName: row.normalizedName,
        country: country.name,
        countryId: row.countryId,
        region: country.region as Region,
        city: null,
        latitude: null,
        longitude: null,
        website: null,
        note: null,
        isPublic: false,
        source: "official",
        sourceUrl: null,
        sourceTitle: sourceTitle(row.excelRow),
        sourceCheckedOn: null,
        verification: "source-imported",
      },
    ];
  });
  const known = new Set([...institutionIds, ...institutions.map((row) => row.id)]);

  const enriched = base.agreements.map((agreement): Agreement => {
    const row = byCode.get(agreement.id);
    if (!row) return agreement;
    return {
      ...agreement,
      startDate: agreement.startDate ?? row.startDate,
      endDate: agreement.endDate ?? row.endDate,
      recordStatus:
        agreement.recordStatus === "not-stated" && row.recordStatus
          ? (row.recordStatus as AgreementRecordStatus)
          : agreement.recordStatus,
    };
  });
  const added = snapshot.agreements
    .filter((row) => !agreementIds.has(row.code) && known.has(row.institutionSlug))
    .map(toAgreement);

  return {
    ...base,
    institutions: [...base.institutions, ...institutions],
    agreements: [...enriched, ...added],
  };
}

const snapshotInstitutionIds = new Set(snapshot.institutions.map((row) => row.slug));

/** A university the snapshot adds, which the database may not hold yet. */
export const isSnapshotInstitution = (slug: string) => snapshotInstitutionIds.has(slug);

/** An agreement the snapshot holds, which the database may not hold yet. */
export const isSnapshotAgreement = (code: string) => registerScope.agreements.has(code);

/** What the DoIC MoU register records, for `retireStaleAgreements`. */
export const registerScope: RegisterScope = {
  listed: new Set(snapshot.listedInstitutions),
  agreements: new Set(snapshot.agreements.map((row) => row.code)),
  expired: new Set(
    snapshot.agreements
      .filter((row) => !row.startDate && !row.endDate && /^expired$/i.test(row.details.recordedStatus?.trim() ?? ""))
      .map((row) => row.code),
  ),
};

/** Register source rows, without the columns that name or reach a person. */
export function snapshotRows(): RegisterRow[] {
  return snapshot.rows.map((row) => ({
    importKey: row.importKey,
    workbook: snapshot.source,
    sheet: row.sheet as SheetKey,
    excelRow: row.excelRow,
    values: row.values as unknown as Record<string, CellValue>,
    formulas: row.formulas as unknown as Record<string, string>,
    issues: [],
    institutionId: row.institutionId,
    agreementId: row.agreementId,
    matchStatus: row.matchStatus as MatchStatus,
    matchNote: null,
  }));
}

/** Register details by agreement id. */
export function snapshotDetails(): Map<string, AgreementDetails> {
  return new Map(
    snapshot.agreements.map((row) => [
      row.code,
      { agreementId: row.code, qsRanking: null, remarks: null, documentUrl: null, ...row.details },
    ]),
  );
}
