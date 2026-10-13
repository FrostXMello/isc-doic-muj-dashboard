/**
 * Parsing and validation for programmes, offerings, opportunities,
 * activities, documents, document files, and portal settings.
 *
 * Pure functions so they can be unit-tested. Every field maps onto a column
 * that exists in supabase/migrations; the database enforces the same shapes
 * (checks, enums, foreign keys) and row level security decides who may
 * write. These checks only give clear messages before a round trip.
 */

import {
  fail,
  isOneOf,
  isValidDate,
  optional,
  type Parsed,
  randomSuffix,
  SLUG_PATTERN,
  text,
  URL_PATTERN,
  verificationOptions,
} from "@/lib/internal/record-forms";
import type {
  ActivityRecordStatus,
  ActivityType,
  AvailabilityState,
  DocumentStatus,
  DocumentType,
  OpportunityRecordStatus,
  ProgramType,
  VerificationStatus,
} from "@/lib/internal/types";

export const programTypeOptions: readonly ProgramType[] = [
  "student-exchange",
  "semester-exchange",
  "pathway-programs",
  "academic-visits",
  "dual-degree",
  "summer-winter-school",
];
export const availabilityOptions: readonly AvailabilityState[] = ["open", "closed", "suspended"];
export const opportunityStatusOptions: readonly OpportunityRecordStatus[] = ["draft", "published", "archived"];
export const activityTypeOptions: readonly ActivityType[] = [
  "inbound-visit",
  "outbound-visit",
  "delegation",
  "event",
  "virtual-meeting",
];
export const activityStatusOptions: readonly ActivityRecordStatus[] = ["planned", "confirmed", "completed", "cancelled"];
export const documentTypeOptions: readonly DocumentType[] = [
  "agreement",
  "brochure",
  "programme-guide",
  "policy",
  "report",
  "form",
  "newsletter",
  "other",
];
export const documentStatusOptions: readonly DocumentStatus[] = ["draft", "under-review", "final", "archived"];

type Errors = Record<string, string>;

function checkLength(errors: Errors, key: string, value: string, max: number, required?: string) {
  if (required && !value) errors[key] = required;
  else if (value.length > max) errors[key] = `Use at most ${max} characters.`;
}

function checkUrl(errors: Errors, key: string, value: string) {
  if (value && (!URL_PATTERN.test(value) || value.length > 500)) {
    errors[key] = "Enter a full link starting with https://.";
  }
}

function checkDates(errors: Errors, startKey: string, start: string, endKey: string, end: string, message: string) {
  if (start && !isValidDate(start)) errors[startKey] = "Enter a valid date.";
  if (end && !isValidDate(end)) errors[endKey] = "Enter a valid date.";
  if (!errors[startKey] && !errors[endKey] && start && end && end < start) errors[endKey] = message;
}

function checkKey(errors: Errors, key: string, value: string, message: string) {
  if (value && !SLUG_PATTERN.test(value)) errors[key] = message;
}

function provenance(formData: FormData, errors: Errors) {
  const verification = text(formData, "verification") || "unverified";
  const sourceUrl = text(formData, "sourceUrl");
  if (!isOneOf(verification, verificationOptions)) errors.verification = "Choose a verification state.";
  checkUrl(errors, "sourceUrl", sourceUrl);
  return { verification: verification as VerificationStatus, sourceUrl: optional(sourceUrl) };
}

// ---------------------------------------------------------------------------
// Programmes
// ---------------------------------------------------------------------------

export type ProgramInput = {
  type: ProgramType;
  name: string;
  description: string;
  generalAudience: string | null;
  isPublished: boolean;
  sortOrder: number;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseProgramForm(formData: FormData): Parsed<ProgramInput> {
  const errors: Errors = {};
  const type = text(formData, "type");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const generalAudience = text(formData, "generalAudience");
  const sortOrderText = text(formData, "sortOrder") || "0";
  if (!isOneOf(type, programTypeOptions)) errors.type = "Choose a programme type.";
  checkLength(errors, "name", name, 120, "Enter the programme name.");
  checkLength(errors, "description", description, 4000, "Describe the programme.");
  checkLength(errors, "generalAudience", generalAudience, 500);
  const sortOrder = Number(sortOrderText);
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999) errors.sortOrder = "Use a whole number from 0 to 999.";
  const source = provenance(formData, errors);

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      type: type as ProgramType,
      name,
      description,
      generalAudience: optional(generalAudience),
      isPublished: formData.get("isPublished") === "on",
      sortOrder,
      ...source,
    },
  };
}

// ---------------------------------------------------------------------------
// Offerings (program_availability)
// ---------------------------------------------------------------------------

export type OfferingInput = {
  programType: ProgramType;
  institutionSlug: string;
  agreementCode: string | null;
  availability: AvailabilityState | null;
  duration: string | null;
  intake: string | null;
  applicationStart: string | null;
  applicationEnd: string | null;
  eligibility: string | null;
  creditInformation: string | null;
  notes: string | null;
  isPublished: boolean;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseOfferingForm(formData: FormData): Parsed<OfferingInput> {
  const errors: Errors = {};
  const programType = text(formData, "program");
  const institutionSlug = text(formData, "institution");
  const agreementCode = text(formData, "agreement");
  const availability = text(formData, "availability");
  const duration = text(formData, "duration");
  const intake = text(formData, "intake");
  const applicationStart = text(formData, "applicationStart");
  const applicationEnd = text(formData, "applicationEnd");
  const eligibility = text(formData, "eligibility");
  const creditInformation = text(formData, "creditInformation");
  const notes = text(formData, "notes");

  if (!isOneOf(programType, programTypeOptions)) errors.program = "Choose a programme.";
  if (!SLUG_PATTERN.test(institutionSlug)) errors.institution = "Choose a university.";
  checkKey(errors, "agreement", agreementCode, "Choose an agreement.");
  if (availability && !isOneOf(availability, availabilityOptions)) errors.availability = "Choose a state.";
  checkLength(errors, "duration", duration, 120);
  checkLength(errors, "intake", intake, 120);
  checkDates(errors, "applicationStart", applicationStart, "applicationEnd", applicationEnd,
    "The window can't close before it opens.");
  checkLength(errors, "eligibility", eligibility, 2000);
  checkLength(errors, "creditInformation", creditInformation, 2000);
  checkLength(errors, "notes", notes, 2000);
  const source = provenance(formData, errors);

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      programType: programType as ProgramType,
      institutionSlug,
      agreementCode: optional(agreementCode),
      availability: availability ? (availability as AvailabilityState) : null,
      duration: optional(duration),
      intake: optional(intake),
      applicationStart: optional(applicationStart),
      applicationEnd: optional(applicationEnd),
      eligibility: optional(eligibility),
      creditInformation: optional(creditInformation),
      notes: optional(notes),
      isPublished: formData.get("isPublished") === "on",
      ...source,
    },
  };
}

// ---------------------------------------------------------------------------
// Opportunities (application calls)
// ---------------------------------------------------------------------------

export type OpportunityInput = {
  title: string;
  programType: ProgramType;
  offeringCode: string | null;
  institutionSlug: string | null;
  opensOn: string | null;
  deadline: string | null;
  recordStatus: OpportunityRecordStatus;
  summary: string;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseOpportunityForm(formData: FormData): Parsed<OpportunityInput> {
  const errors: Errors = {};
  const title = text(formData, "title");
  const programType = text(formData, "program");
  const offeringCode = text(formData, "offering");
  const institutionSlug = text(formData, "institution");
  const opensOn = text(formData, "opensOn");
  const deadline = text(formData, "deadline");
  const recordStatus = text(formData, "recordStatus");
  const summary = text(formData, "summary");

  checkLength(errors, "title", title, 300, "Enter the call's title.");
  if (!isOneOf(programType, programTypeOptions)) errors.program = "Choose a programme.";
  checkKey(errors, "offering", offeringCode, "Choose an offering.");
  checkKey(errors, "institution", institutionSlug, "Choose a university.");
  checkDates(errors, "opensOn", opensOn, "deadline", deadline, "The deadline can't be before the call opens.");
  if (!isOneOf(recordStatus, opportunityStatusOptions)) errors.recordStatus = "Choose a status.";
  checkLength(errors, "summary", summary, 4000, "Summarise who can apply and how.");
  if (recordStatus === "published" && !deadline && !errors.deadline) {
    errors.deadline = "Published calls need a deadline.";
  }
  const source = provenance(formData, errors);

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      title,
      programType: programType as ProgramType,
      offeringCode: optional(offeringCode),
      institutionSlug: optional(institutionSlug),
      opensOn: optional(opensOn),
      deadline: optional(deadline),
      recordStatus: recordStatus as OpportunityRecordStatus,
      summary,
      ...source,
    },
  };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export type ActivityInput = {
  title: string;
  type: ActivityType;
  recordStatus: ActivityRecordStatus;
  startDate: string;
  endDate: string | null;
  countrySlug: string;
  city: string | null;
  institutionSlug: string | null;
  agreementCode: string | null;
  summary: string;
  participants: string | null;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseActivityForm(formData: FormData): Parsed<ActivityInput> {
  const errors: Errors = {};
  const title = text(formData, "title");
  const type = text(formData, "type");
  const recordStatus = text(formData, "recordStatus");
  const startDate = text(formData, "startDate");
  const endDate = text(formData, "endDate");
  const countrySlug = text(formData, "country");
  const city = text(formData, "city");
  const institutionSlug = text(formData, "institution");
  const agreementCode = text(formData, "agreement");
  const summary = text(formData, "summary");
  const participants = text(formData, "participants");

  checkLength(errors, "title", title, 300, "Enter the activity's title.");
  if (!isOneOf(type, activityTypeOptions)) errors.type = "Choose an activity type.";
  if (!isOneOf(recordStatus, activityStatusOptions)) errors.recordStatus = "Choose a status.";
  if (!startDate) errors.startDate = "Enter the start date.";
  checkDates(errors, "startDate", startDate, "endDate", endDate, "The end date can't be before the start date.");
  if (!SLUG_PATTERN.test(countrySlug)) errors.country = "Choose a country.";
  checkLength(errors, "city", city, 120);
  checkKey(errors, "institution", institutionSlug, "Choose a university.");
  checkKey(errors, "agreement", agreementCode, "Choose an agreement.");
  checkLength(errors, "summary", summary, 4000, "Summarise the activity.");
  checkLength(errors, "participants", participants, 1000);
  const source = provenance(formData, errors);

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      title,
      type: type as ActivityType,
      recordStatus: recordStatus as ActivityRecordStatus,
      startDate,
      endDate: optional(endDate),
      countrySlug,
      city: optional(city),
      institutionSlug: optional(institutionSlug),
      agreementCode: optional(agreementCode),
      summary,
      participants: optional(participants),
      ...source,
    },
  };
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type DocumentInput = {
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  revisedOn: string | null;
  description: string | null;
  externalUrl: string | null;
  publiclyAccessible: boolean;
  links: { institutionSlug: string | null; agreementCode: string | null; programType: ProgramType | null };
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function parseDocumentForm(formData: FormData): Parsed<DocumentInput> {
  const errors: Errors = {};
  const title = text(formData, "title");
  const type = text(formData, "type");
  const status = text(formData, "status");
  const revisedOn = text(formData, "revisedOn");
  const description = text(formData, "description");
  const externalUrl = text(formData, "externalUrl");
  const institutionSlug = text(formData, "linkInstitution");
  const agreementCode = text(formData, "linkAgreement");
  const programType = text(formData, "linkProgram");

  checkLength(errors, "title", title, 300, "Enter the document's title.");
  if (!isOneOf(type, documentTypeOptions)) errors.type = "Choose a document type.";
  if (!isOneOf(status, documentStatusOptions)) errors.status = "Choose a status.";
  if (revisedOn && !isValidDate(revisedOn)) errors.revisedOn = "Enter a valid date.";
  checkLength(errors, "description", description, 4000);
  checkUrl(errors, "externalUrl", externalUrl);
  checkKey(errors, "linkInstitution", institutionSlug, "Choose a university.");
  checkKey(errors, "linkAgreement", agreementCode, "Choose an agreement.");
  if (programType && !isOneOf(programType, programTypeOptions)) errors.linkProgram = "Choose a programme.";
  const source = provenance(formData, errors);

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      title,
      type: type as DocumentType,
      status: status as DocumentStatus,
      revisedOn: optional(revisedOn),
      description: optional(description),
      externalUrl: optional(externalUrl),
      publiclyAccessible: formData.get("publiclyAccessible") === "on",
      links: {
        institutionSlug: optional(institutionSlug),
        agreementCode: optional(agreementCode),
        programType: programType ? (programType as ProgramType) : null,
      },
      ...source,
    },
  };
}

/** Mirrors the institutional-documents bucket (20260930120700_storage.sql). */
export const DOCUMENT_BUCKET = "institutional-documents";
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const allowedDocumentTypes: readonly string[] = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
];

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const UUID_PATTERN = new RegExp(`^${UUID}$`, "i");

export function checkDocumentFile(file: { size: number; type: string }): string | null {
  if (file.size <= 0) return "Choose a file.";
  if (file.size > MAX_DOCUMENT_BYTES) return "Files can be at most 25 MB.";
  if (!allowedDocumentTypes.includes(file.type)) return "Upload a PDF, Word, Excel, PowerPoint, text, CSV, PNG, or JPEG file.";
  return null;
}

/** Storage-safe file name: ASCII letters, digits, dot, dash, underscore. */
export function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^[-.]+|-+$/g, "")
    .slice(-100);
  return cleaned || "file";
}

/** Object path for a document's file: documents/{document uuid}/{timestamp}-{name}. */
export function documentObjectPath(documentId: string, fileName: string, now: number = Date.now()) {
  return `documents/${documentId}/${now}-${safeFileName(fileName)}`;
}

/** Whether `path` is a file of document `documentId` under the bucket's path convention. */
export function isDocumentObjectPath(documentId: string, path: string) {
  if (!UUID_PATTERN.test(documentId)) return false;
  return new RegExp(`^documents/${documentId}/[^/]+$`, "i").test(path) && !path.includes("..");
}

// ---------------------------------------------------------------------------
// Portal settings
// ---------------------------------------------------------------------------

export type SettingsInput = { accessContactEmail: string | null; accessContactNote: string | null };

export function parseSettingsForm(formData: FormData): Parsed<SettingsInput> {
  const errors: Errors = {};
  const accessContactEmail = text(formData, "accessContactEmail");
  const accessContactNote = text(formData, "accessContactNote");
  if (accessContactEmail && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(accessContactEmail) || accessContactEmail.length > 254)) {
    errors.accessContactEmail = "Enter a valid email address.";
  }
  checkLength(errors, "accessContactNote", accessContactNote, 300);
  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: { accessContactEmail: optional(accessContactEmail), accessContactNote: optional(accessContactNote) },
  };
}

/** Stable URL key for a new record, e.g. `opp-k3f9x2ab`. */
export function newRecordCode(prefix: string, random: () => number = Math.random) {
  return `${prefix}-${randomSuffix(random)}${randomSuffix(random)}`;
}
