import "server-only";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadExisting } from "../../../../scripts/mou-workbook/existing";
import { buildPlan, type Plan, type Workbook } from "../../../../scripts/mou-workbook/plan";
import type { Dataset } from "@/lib/internal/data/dataset";
import type { RegisterAccess } from "@/lib/internal/data/register";
import type { Agreement, Institution, InstitutionContact, Region } from "@/lib/internal/types";
import { officialCountries, referenceCountries } from "@/lib/official/countries";

/**
 * Local preview of the DoIC MoU register on the static source: the same plan
 * the import SQL is generated from, applied in memory to the official dataset.
 * Reads the gitignored workbook extraction in data/private/, so it only runs
 * on a machine that holds it, and never on Vercel. Opt in with
 * INTERNAL_LOCAL_REGISTER=true.
 */

const root = process.cwd();
const STRUCTURED = join(root, "data/private/mou_details_structured.json");
const CONTACTS = join(root, "data/private/muj-nodal-contacts.json");

export function localRegisterEnabled() {
  return process.env.INTERNAL_LOCAL_REGISTER === "true" && !process.env.VERCEL && existsSync(STRUCTURED);
}

export type LocalRegister = {
  data: Dataset;
  contacts: InstitutionContact[];
  register: Extract<RegisterAccess, { state: "granted" }>;
};

type ContactsFile = {
  sourceUrl: string;
  checkedOn: string;
  contacts: { agreementId: string; roleLabel: string; name: string | null; phone: string | null; email: string | null }[];
};

let cached: { key: string; base: Dataset; today: string; value: LocalRegister } | undefined;

function sourceTitle(plan: Plan, row: number) {
  return `DoIC MoU register (${plan.sourceFile}), MoU list row ${row}`;
}

function build(base: Dataset, today: string): LocalRegister {
  const plan = buildPlan(JSON.parse(readFileSync(STRUCTURED, "utf8")) as Workbook, loadExisting(), today);

  const countries = new Map<string, { name: string; region: string | null }>(
    [...officialCountries, ...referenceCountries].map((country) => [country.id, country]),
  );
  for (const country of plan.countries) countries.set(country.slug, country);

  const institutions: Institution[] = plan.institutions.flatMap((institution) => {
    const country = countries.get(institution.countryId);
    if (!country?.region) return [];
    return [
      {
        id: institution.slug,
        name: institution.name,
        normalizedName: institution.normalizedName,
        country: country.name,
        countryId: institution.countryId,
        region: country.region as Region,
        city: null,
        latitude: null,
        longitude: null,
        website: null,
        note: institution.note,
        isPublic: false,
        source: "official",
        sourceUrl: null,
        sourceTitle: sourceTitle(plan, institution.excelRow),
        sourceCheckedOn: null,
        verification: "source-imported",
      },
    ];
  });

  const planned = new Map(plan.agreements.map((agreement) => [agreement.code, agreement]));
  const enriched = base.agreements.map((agreement): Agreement => {
    const fill = planned.get(agreement.id)?.fill;
    if (!fill) return agreement;
    return {
      ...agreement,
      startDate: agreement.startDate ?? fill.startDate,
      endDate: agreement.endDate ?? fill.endDate,
      recordStatus: agreement.recordStatus === "not-stated" && fill.recordStatus ? fill.recordStatus : agreement.recordStatus,
    };
  });
  const added: Agreement[] = plan.agreements
    .filter((agreement) => !agreement.existing)
    .map((agreement) => ({
      id: agreement.code,
      reference: agreement.reference,
      institutionId: agreement.institutionSlug,
      title: agreement.title,
      type: agreement.type,
      typeLabel: agreement.typeLabel,
      recordStatus: agreement.fill.recordStatus ?? "not-stated",
      startDate: agreement.fill.startDate,
      endDate: agreement.fill.endDate,
      renewal: null,
      collaborationAreas: [],
      sourceSection: null,
      notes: null,
      source: "official",
      sourceUrl: null,
      sourceTitle: sourceTitle(plan, agreement.excelRow),
      sourceCheckedOn: null,
      verification: agreement.needsReview ? "needs-review" : "source-imported",
    }));

  const institutionOf = new Map([...enriched, ...added].map((agreement) => [agreement.id, agreement.institutionId]));
  const fills = new Map(plan.contactFills.map((fill) => [fill.code, fill]));
  const existingContacts: InstitutionContact[] = existsSync(CONTACTS)
    ? (JSON.parse(readFileSync(CONTACTS, "utf8")) as ContactsFile).contacts.flatMap((contact) => {
        const institutionId = institutionOf.get(contact.agreementId);
        if (!institutionId || (!contact.name && !contact.phone && !contact.email)) return [];
        const id = `nc-${contact.agreementId}`;
        const fill = fills.get(id);
        return [
          {
            id,
            institutionId,
            agreementId: contact.agreementId,
            roleLabel: contact.roleLabel,
            name: contact.name,
            phone: contact.phone ?? fill?.phone ?? null,
            email: contact.email ?? fill?.email ?? null,
            visibility: "internal" as const,
          },
        ];
      })
    : [];
  const addedContacts: InstitutionContact[] = plan.contacts.map((contact) => ({
    id: contact.code,
    institutionId: contact.institutionSlug,
    agreementId: contact.agreementCode,
    roleLabel: contact.roleLabel,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    visibility: "internal",
  }));

  return {
    data: {
      ...base,
      institutions: [...base.institutions, ...institutions],
      agreements: [...enriched, ...added],
    },
    contacts: [...existingContacts, ...addedContacts],
    register: {
      state: "granted",
      details: new Map(plan.agreements.map((agreement) => [agreement.code, { agreementId: agreement.code, ...agreement.details }])),
      rows: plan.rows.map((row) => ({
        importKey: row.importKey,
        workbook: plan.sourceFile,
        sheet: row.sheet,
        excelRow: row.excelRow,
        values: row.values,
        formulas: row.formulas,
        issues: row.issues,
        institutionId: row.institutionSlug,
        agreementId: row.agreementCode,
        matchStatus: row.matchStatus,
        matchNote: row.matchNote,
      })),
      contactNotes: new Map(plan.contacts.flatMap((contact) => (contact.note ? [[contact.code, contact.note] as const] : []))),
    },
  };
}

/** Rebuilt when the extraction or contacts file changes, or the day turns. */
export function loadLocalRegister(base: Dataset, today: string): LocalRegister {
  const key = [STRUCTURED, CONTACTS].map((path) => (existsSync(path) ? statSync(path).mtimeMs : 0)).join(":");
  if (!cached || cached.key !== key || cached.base !== base || cached.today !== today) {
    cached = { key, base, today, value: build(base, today) };
  }
  return cached.value;
}
