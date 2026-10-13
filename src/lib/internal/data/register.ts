import "server-only";
import { cache } from "react";
import { openDataContext } from "@/lib/internal/data/context";
import type { CellValue, SheetKey } from "@/lib/internal/workbook/source";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * DoIC MoU register data (supabase/migrations/20261013090000_mou_workbook.sql).
 * Read as the signed-in user, so RLS limits it to internal roles. The static
 * source carries none of it.
 */

export type AgreementDetails = {
  agreementId: string;
  doicReference: string | null;
  initiationYear: number | null;
  renewalYear: number | null;
  periodText: string | null;
  expiryText: string | null;
  recordedStatus: string | null;
  qsRanking: string | null;
  theRanking: string | null;
  faculty: string | null;
  department: string | null;
  opportunities: string | null;
  programmeReference: string | null;
  remarks: string | null;
  documentUrl: string | null;
};

export type MatchStatus = "matched" | "created" | "duplicate" | "unresolved" | "standalone";

export type RegisterRow = {
  importKey: string;
  workbook: string;
  sheet: SheetKey;
  excelRow: number;
  values: Record<string, CellValue>;
  formulas: Record<string, string>;
  issues: string[];
  institutionId: string | null;
  agreementId: string | null;
  matchStatus: MatchStatus;
  matchNote: string | null;
};

export type RegisterAccess =
  | {
      state: "granted";
      /** By agreement id. */
      details: Map<string, AgreementDetails>;
      rows: RegisterRow[];
      /** Contact id -> text kept from the register that is not a phone or email. */
      contactNotes: Map<string, string>;
    }
  | { state: "restricted"; reason: "static-source" | "no-internal-role" | "not-migrated" };

type DetailsRow = {
  doic_reference: string | null;
  initiation_year: number | null;
  renewal_year: number | null;
  period_text: string | null;
  expiry_text: string | null;
  recorded_status: string | null;
  qs_ranking: string | null;
  the_ranking: string | null;
  faculty: string | null;
  department: string | null;
  opportunities: string | null;
  programme_reference: string | null;
  remarks: string | null;
  document_url: string | null;
  agreement: { code: string } | null;
};

type SourceRow = {
  import_key: string;
  workbook: string;
  sheet: SheetKey;
  excel_row: number;
  source_values: Record<string, CellValue>;
  source_formulas: Record<string, string>;
  issues: string[];
  match_status: MatchStatus;
  match_note: string | null;
  institution: { slug: string } | null;
  agreement: { code: string } | null;
};

const detailColumns =
  "doic_reference, initiation_year, renewal_year, period_text, expiry_text, recorded_status, qs_ranking, " +
  "the_ranking, faculty, department, opportunities, programme_reference, remarks, document_url";

const sourceColumns =
  "import_key, workbook, sheet, excel_row, source_values, source_formulas, issues, match_status, match_note";

function toDetails(row: DetailsRow): AgreementDetails | null {
  if (!row.agreement) return null;
  return {
    agreementId: row.agreement.code,
    doicReference: row.doic_reference,
    initiationYear: row.initiation_year,
    renewalYear: row.renewal_year,
    periodText: row.period_text,
    expiryText: row.expiry_text,
    recordedStatus: row.recorded_status,
    qsRanking: row.qs_ranking,
    theRanking: row.the_ranking,
    faculty: row.faculty,
    department: row.department,
    opportunities: row.opportunities,
    programmeReference: row.programme_reference,
    remarks: row.remarks,
    documentUrl: row.document_url,
  };
}

function toRegisterRow(row: SourceRow): RegisterRow {
  return {
    importKey: row.import_key,
    workbook: row.workbook,
    sheet: row.sheet,
    excelRow: row.excel_row,
    values: row.source_values,
    formulas: row.source_formulas,
    issues: row.issues,
    institutionId: row.institution?.slug ?? null,
    agreementId: row.agreement?.code ?? null,
    matchStatus: row.match_status,
    matchNote: row.match_note,
  };
}

type RegisterClient =
  | { client: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>> }
  | { restricted: "static-source" | "no-internal-role" };

async function registerClient(): Promise<RegisterClient> {
  const { source, contactAccess } = await openDataContext();
  if (source !== "supabase") return { restricted: "static-source" };
  if (contactAccess.state === "restricted") return { restricted: "no-internal-role" };
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase is not configured.");
  return { client };
}

/** The register migration has not been applied to this database yet. */
function missingRelation(error: { code?: string }) {
  return error.code === "42P01" || error.code === "42703" || error.code === "PGRST200" || error.code === "PGRST205";
}

/**
 * Every register detail, source row, and contact note the user may read
 * (a few hundred rows). Memoised per request so the list, search, and
 * detail pages share one read.
 */
export const loadRegister = cache(async (): Promise<RegisterAccess> => {
  const access = await registerClient();
  if (!("client" in access)) return { state: "restricted", reason: access.restricted };
  const { client } = access;

  const [details, rows, notes] = await Promise.all([
    client.from("agreement_details").select(`${detailColumns}, agreement:agreements(code)`).range(0, 9999),
    client
      .from("source_workbook_rows")
      .select(`${sourceColumns}, institution:institutions(slug), agreement:agreements(code)`)
      .order("sheet")
      .order("excel_row")
      .range(0, 9999),
    client.from("institution_contacts").select("code, source_note").not("source_note", "is", null).range(0, 9999),
  ]);
  for (const result of [details, rows, notes]) {
    if (result.error && missingRelation(result.error)) return { state: "restricted", reason: "not-migrated" };
  }
  if (details.error) throw new Error(`Supabase query on agreement_details failed: ${details.error.message}`);
  if (rows.error) throw new Error(`Supabase query on source_workbook_rows failed: ${rows.error.message}`);
  if (notes.error) throw new Error(`Supabase query on institution_contacts failed: ${notes.error.message}`);

  return {
    state: "granted",
    details: new Map(
      ((details.data ?? []) as unknown as DetailsRow[]).flatMap((row) => {
        const entry = toDetails(row);
        return entry ? [[entry.agreementId, entry] as const] : [];
      }),
    ),
    rows: ((rows.data ?? []) as unknown as SourceRow[]).map(toRegisterRow),
    contactNotes: new Map(
      ((notes.data ?? []) as unknown as { code: string; source_note: string }[]).map((row) => [
        row.code,
        row.source_note,
      ]),
    ),
  };
});
