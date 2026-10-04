/**
 * Parsing and validation for the university and agreement (MoU) forms.
 *
 * Pure functions so they can be unit-tested. The database enforces the same
 * shapes (checks, enums, unique keys) and row level security decides who may
 * write; these checks only give clear messages before a round trip.
 */

import type {
  AgreementRecordStatus,
  AgreementType,
  RenewalMode,
  VerificationStatus,
} from "@/lib/internal/types";

export type RecordFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values, echoed back so the form keeps them after an error. */
  values?: Record<string, string | string[]>;
};

export const agreementTypeOptions: readonly AgreementType[] = [
  "mou",
  "student-exchange",
  "agreement-of-cooperation",
  "addendum",
  "academic-agreement",
  "research-collaboration",
  "dual-degree",
  "other",
  "not-stated",
];

export const agreementRecordStatusOptions: readonly AgreementRecordStatus[] = [
  "draft",
  "under-review",
  "signed",
  "terminated",
  "not-stated",
];

export const agreementRecordStatusLabel: Record<AgreementRecordStatus, string> = {
  draft: "Draft",
  "under-review": "Under review",
  signed: "Signed",
  terminated: "Terminated",
  "not-stated": "Not stated",
};

export const renewalOptions: readonly RenewalMode[] = ["automatic", "by-review"];

export const verificationOptions: readonly VerificationStatus[] = [
  "unverified",
  "source-imported",
  "needs-review",
  "verified",
];

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const URL_PATTERN = /^https?:\/\/\S+$/i;
export const MAX_PARTNERS = 20;

type Parsed<T> = { ok: true; value: T } | { ok: false; state: RecordFormState };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string) {
  return value === "" ? null : value;
}

function isOneOf<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

function isValidDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** The submitted fields (minus framework fields), for repopulating the form. */
export function formValues(formData: FormData) {
  const values: Record<string, string | string[]> = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$")) continue;
    const all = formData.getAll(key).filter((v): v is string => typeof v === "string");
    values[key] = key === "partners" ? all : (all[0] ?? "");
  }
  return values;
}

export function fieldError(formData: FormData, fieldErrors: Record<string, string>): RecordFormState {
  return { error: "Check the highlighted fields.", fieldErrors, values: formValues(formData) };
}

function fail(formData: FormData, fieldErrors: Record<string, string>): { ok: false; state: RecordFormState } {
  return { ok: false, state: fieldError(formData, fieldErrors) };
}

export type InstitutionInput = {
  name: string;
  normalizedName: string | null;
  countrySlug: string;
  city: string | null;
  website: string | null;
  note: string | null;
  isPublic: boolean;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseInstitutionForm(formData: FormData): Parsed<InstitutionInput> {
  const errors: Record<string, string> = {};
  const name = text(formData, "name");
  const normalizedName = text(formData, "normalizedName");
  const countrySlug = text(formData, "country");
  const city = text(formData, "city");
  const website = text(formData, "website");
  const note = text(formData, "note");
  const verification = text(formData, "verification") || "unverified";
  const sourceUrl = text(formData, "sourceUrl");

  if (!name) errors.name = "Enter the university's name.";
  else if (name.length > 200) errors.name = "Use at most 200 characters.";
  if (normalizedName.length > 200) errors.normalizedName = "Use at most 200 characters.";
  if (!SLUG_PATTERN.test(countrySlug)) errors.country = "Choose a country.";
  if (city.length > 120) errors.city = "Use at most 120 characters.";
  if (website && (!URL_PATTERN.test(website) || website.length > 500)) {
    errors.website = "Enter a full link starting with https://.";
  }
  if (note.length > 2000) errors.note = "Use at most 2000 characters.";
  if (!isOneOf(verification, verificationOptions)) errors.verification = "Choose a verification state.";
  if (sourceUrl && (!URL_PATTERN.test(sourceUrl) || sourceUrl.length > 500)) {
    errors.sourceUrl = "Enter a full link starting with https://.";
  }

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      name,
      normalizedName: optional(normalizedName),
      countrySlug,
      city: optional(city),
      website: optional(website),
      note: optional(note),
      isPublic: formData.get("isPublic") === "on",
      verification: verification as VerificationStatus,
      sourceUrl: optional(sourceUrl),
    },
  };
}

export type AgreementInput = {
  title: string;
  reference: string;
  leadSlug: string;
  partnerSlugs: string[];
  type: AgreementType;
  typeLabel: string | null;
  recordStatus: AgreementRecordStatus;
  startDate: string | null;
  endDate: string | null;
  renewal: RenewalMode | null;
  notes: string | null;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseAgreementForm(formData: FormData): Parsed<AgreementInput> {
  const errors: Record<string, string> = {};
  const title = text(formData, "title");
  const reference = text(formData, "reference");
  const leadSlug = text(formData, "lead");
  const type = text(formData, "type");
  const typeLabel = text(formData, "typeLabel");
  const recordStatus = text(formData, "recordStatus");
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  const renewal = text(formData, "renewal");
  const notes = text(formData, "notes");
  const verification = text(formData, "verification") || "unverified";
  const sourceUrl = text(formData, "sourceUrl");
  const partnerInputs = formData
    .getAll("partners")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!title) errors.title = "Enter the agreement title.";
  else if (title.length > 300) errors.title = "Use at most 300 characters.";
  if (!reference) errors.reference = "Enter a reference.";
  else if (reference.length > 80) errors.reference = "Use at most 80 characters.";
  if (!SLUG_PATTERN.test(leadSlug)) errors.lead = "Choose the lead university.";
  if (!isOneOf(type, agreementTypeOptions)) errors.type = "Choose an agreement type.";
  if (typeLabel.length > 200) errors.typeLabel = "Use at most 200 characters.";
  if (!isOneOf(recordStatus, agreementRecordStatusOptions)) errors.recordStatus = "Choose a status.";
  if (startDate && !isValidDate(startDate)) errors.startDate = "Enter a valid date.";
  if (endDate && !isValidDate(endDate)) errors.endDate = "Enter a valid date.";
  if (!errors.startDate && !errors.endDate && startDate && endDate && endDate < startDate) {
    errors.endDate = "The end date can't be before the start date.";
  }
  if (renewal && !isOneOf(renewal, renewalOptions)) errors.renewal = "Choose a renewal mode.";
  if (notes.length > 4000) errors.notes = "Use at most 4000 characters.";
  if (!isOneOf(verification, verificationOptions)) errors.verification = "Choose a verification state.";
  if (sourceUrl && (!URL_PATTERN.test(sourceUrl) || sourceUrl.length > 500)) {
    errors.sourceUrl = "Enter a full link starting with https://.";
  }
  if (!partnerInputs.every((slug) => SLUG_PATTERN.test(slug))) errors.partners = "Unknown university.";
  const partnerSlugs = [...new Set(partnerInputs)].filter((slug) => slug !== leadSlug);
  if (partnerSlugs.length > MAX_PARTNERS) errors.partners = `Choose at most ${MAX_PARTNERS} partner universities.`;

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      title,
      reference,
      leadSlug,
      partnerSlugs,
      type: type as AgreementType,
      typeLabel: optional(typeLabel),
      recordStatus: recordStatus as AgreementRecordStatus,
      startDate: optional(startDate),
      endDate: optional(endDate),
      renewal: renewal ? (renewal as RenewalMode) : null,
      notes: optional(notes),
      verification: verification as VerificationStatus,
      sourceUrl: optional(sourceUrl),
    },
  };
}

/** Readable slug from a name, with a random suffix so it stays unique. */
export function newInstitutionSlug(name: string, random: () => number = Math.random) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return `${base || "university"}-${randomSuffix(random)}`;
}

export function newAgreementCode(random: () => number = Math.random) {
  return `mou-${randomSuffix(random)}${randomSuffix(random)}`;
}

function randomSuffix(random: () => number) {
  return Math.floor(random() * 36 ** 4)
    .toString(36)
    .padStart(4, "0");
}
