/**
 * Entity types for the Internal Portal.
 *
 * Institutions, agreements, programmes, and programme availability are kept
 * as separate entities linked by id, following docs/data-model.md. Each type
 * maps to a database table; nothing here implies a relationship that is not
 * recorded as its own row.
 *
 * Dates are ISO calendar strings (YYYY-MM-DD). `null` means "not recorded",
 * never "none" or "open".
 */

import type {
  OfficialAgreementType,
  OfficialRegion,
  VerificationStatus,
} from "@/lib/official/types";

export type { VerificationStatus } from "@/lib/official/types";

export type Region = OfficialRegion;

/**
 * Where a record comes from.
 * - `official`: taken from an official MUJ page (see `sourceUrl`) or entered
 *   by DoIC staff. Imports carry verification `source-imported`, never
 *   `verified`.
 * - `directory`: a name from the earlier illustrative public directory that
 *   does not appear on the official page. Kept for review, never public.
 * - `programme-catalogue`: derived from the public programme categories.
 * - `sample`: fictional placeholder for demonstrating the workflow. Only
 *   loaded when INTERNAL_SAMPLE_DATA=true.
 *
 * Mirrors the `public.data_source` enum in supabase/migrations.
 */
export type RecordSource = "directory" | "programme-catalogue" | "sample" | "official";

/** Where a record was taken from and how far it has been checked. */
export type Provenance = {
  sourceUrl: string | null;
  sourceTitle: string | null;
  /** Date the source was last reviewed. */
  sourceCheckedOn: string | null;
  verification: VerificationStatus;
};

export type Institution = Provenance & {
  id: string;
  /** Name as displayed on the source (official page) or as entered. */
  name: string;
  /** Spelling-normalised name for display and search; identity unchanged. */
  normalizedName: string | null;
  country: string;
  countryId: string;
  region: Region;
  /** Campus city. Null unless a source states it. */
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Only a URL linked from the official source. */
  website: string | null;
  note: string | null;
  /** Shown on the public website. */
  isPublic: boolean;
  source: RecordSource;
};

export type AgreementType = OfficialAgreementType | "research-collaboration" | "dual-degree";

/** Status as stored on the record. `not-stated`: the source gives no status. */
export type AgreementRecordStatus = "draft" | "under-review" | "signed" | "terminated" | "not-stated";

/** Status shown to staff, derived from the stored status and dates. */
export type AgreementStatus =
  | "draft"
  | "under-review"
  | "pending-start"
  | "active"
  | "expiring-soon"
  | "expired"
  | "terminated"
  | "not-stated";

export type RenewalMode = "automatic" | "by-review";

export type Agreement = Provenance & {
  id: string;
  reference: string;
  /** Lead partner institution. */
  institutionId: string;
  /** Further partner institutions on a multi-party agreement; never inferred. */
  partnerInstitutionIds?: readonly string[];
  /** For official rows: the row text exactly as displayed. */
  title: string;
  type: AgreementType;
  /** Agreement wording quoted from the source, when it states one. */
  typeLabel: string | null;
  recordStatus: AgreementRecordStatus;
  startDate: string | null;
  endDate: string | null;
  renewal: RenewalMode | null;
  collaborationAreas: readonly string[];
  /** Heading(s) the row sits under on the official page, e.g. "ASIA › RUSSIA". */
  sourceSection: string | null;
  notes: string | null;
  source: RecordSource;
};

export type ProgramType =
  | "student-exchange"
  | "semester-exchange"
  | "pathway-programs"
  | "academic-visits"
  | "dual-degree"
  | "summer-winter-school";

export type Program = Provenance & {
  id: ProgramType;
  name: string;
  type: ProgramType;
  description: string;
  generalAudience: string | null;
  source: RecordSource;
};

export type AvailabilityState = "open" | "closed" | "suspended";

/** A confirmed institution × programme pairing. Never generated as a cross-product. */
export type ProgramAvailability = Provenance & {
  id: string;
  programId: ProgramType;
  institutionId: string;
  agreementId: string | null;
  availability: AvailabilityState | null;
  duration: string | null;
  intake: string | null;
  applicationStart: string | null;
  applicationEnd: string | null;
  eligibility: string | null;
  creditInformation: string | null;
  notes: string | null;
  source: RecordSource;
};

export type OpportunityRecordStatus = "draft" | "published" | "archived";

export type OpportunityStatus =
  | "draft"
  | "upcoming"
  | "open"
  | "closing-soon"
  | "closed"
  | "archived";

export type Opportunity = Provenance & {
  id: string;
  title: string;
  programId: ProgramType;
  availabilityId: string | null;
  institutionId: string | null;
  opensOn: string | null;
  deadline: string | null;
  recordStatus: OpportunityRecordStatus;
  summary: string;
  source: RecordSource;
};

export type DocumentType =
  | "agreement"
  | "brochure"
  | "programme-guide"
  | "policy"
  | "report"
  | "form"
  | "newsletter"
  | "other";

export type DocumentStatus = "draft" | "under-review" | "final" | "archived";

export type DocumentRecord = Provenance & {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  updatedOn: string | null;
  /** Object-storage key. Null: no file has been uploaded. */
  storageKey: string | null;
  /** Public link to the file on an official site, if one exists. */
  url: string | null;
  /** The link opens without signing in (checked on `sourceCheckedOn`). */
  publiclyAccessible: boolean;
  description: string | null;
  source: RecordSource;
};

/** Attaches a document to exactly one target. */
export type DocumentLink = {
  id: string;
  documentId: string;
  institutionId: string | null;
  agreementId: string | null;
  programId: ProgramType | null;
  availabilityId: string | null;
};

export type ActivityType =
  | "inbound-visit"
  | "outbound-visit"
  | "delegation"
  | "event"
  | "virtual-meeting";

export type ActivityRecordStatus = "planned" | "confirmed" | "completed" | "cancelled";

/** Stored status plus `needs-update` when a planned activity's date has passed. */
export type ActivityStatus = ActivityRecordStatus | "needs-update";

export type Activity = Provenance & {
  id: string;
  title: string;
  type: ActivityType;
  startDate: string;
  endDate: string | null;
  institutionId: string | null;
  country: string;
  city: string | null;
  recordStatus: ActivityRecordStatus;
  summary: string;
  participants: string | null;
  agreementId: string | null;
  source: RecordSource;
};

/** Relationship status for an institution, derived from its agreements. */
export type PartnershipStatus =
  | "active"
  | "renewal-due"
  | "in-progress"
  | "lapsed"
  | "listed"
  | "not-recorded";

/**
 * Internal contact for an institution or agreement (e.g. the MUJ Nodal
 * Officer). Only ever loaded from Supabase for signed-in internal roles.
 */
export type InstitutionContact = {
  id: string;
  institutionId: string;
  agreementId: string | null;
  roleLabel: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  visibility: "internal" | "public";
};

export type AgreementView = Agreement & {
  status: AgreementStatus;
  daysToExpiry: number | null;
  institution: Institution | null;
  partners: Institution[];
};

export type InstitutionView = Institution & {
  partnershipStatus: PartnershipStatus;
  agreementCount: number;
  activeAgreementCount: number;
  offeringCount: number;
  nextExpiry: string | null;
};

export type ProgramAvailabilityView = ProgramAvailability & {
  program: Program;
  institution: Institution | null;
  agreement: AgreementView | null;
};

export type OpportunityView = Opportunity & {
  status: OpportunityStatus;
  daysToDeadline: number | null;
  program: Program;
  institution: Institution | null;
  availability: ProgramAvailability | null;
};

export type DocumentView = DocumentRecord & {
  links: DocumentLinkView[];
};

export type DocumentLinkView = {
  id: string;
  kind: "institution" | "agreement" | "program" | "availability";
  label: string;
  href: string;
};

export type ActivityView = Activity & {
  status: ActivityStatus;
  daysFromToday: number;
  institution: Institution | null;
  agreement: Agreement | null;
};
