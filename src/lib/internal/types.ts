/**
 * Entity types for the Internal Portal.
 *
 * Institutions, agreements, programmes, and programme availability are kept
 * as separate entities linked by id, following docs/data-model.md. Each type
 * maps to a future database table; nothing here implies a relationship that
 * is not recorded as its own row.
 *
 * Dates are ISO calendar strings (YYYY-MM-DD). `null` means "not recorded",
 * never "none" or "open".
 */

import type { PartnerRegion } from "@/lib/data";

export type Region = PartnerRegion;

/**
 * Where a record comes from.
 * - `directory`: derived from the public site's illustrative directory
 *   (src/lib/data.ts). Names are sample names, not confirmed partners.
 * - `programme-catalogue`: derived from the public opportunity categories.
 * - `sample`: placeholder record created for the portal workflow. Fictional.
 * - `official`: entered by DoIC staff in the database. Never used by seeds.
 *
 * Mirrors the `public.data_source` enum in supabase/migrations.
 */
export type RecordSource = "directory" | "programme-catalogue" | "sample" | "official";

export type Institution = {
  id: string;
  name: string;
  country: string;
  countryId: string;
  region: Region;
  city: string;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  /** Country-level editorial note from the public directory, if any. */
  note: string | null;
  source: RecordSource;
};

export type AgreementType =
  | "mou"
  | "student-exchange"
  | "research-collaboration"
  | "dual-degree"
  | "other";

/** Status as stored on the record. */
export type AgreementRecordStatus = "draft" | "under-review" | "signed" | "terminated";

/** Status shown to staff, derived from the stored status and dates. */
export type AgreementStatus =
  | "draft"
  | "under-review"
  | "pending-start"
  | "active"
  | "expiring-soon"
  | "expired"
  | "terminated";

export type RenewalMode = "automatic" | "by-review";

export type Agreement = {
  id: string;
  reference: string;
  institutionId: string;
  title: string;
  type: AgreementType;
  recordStatus: AgreementRecordStatus;
  startDate: string | null;
  endDate: string | null;
  renewal: RenewalMode | null;
  collaborationAreas: readonly string[];
  notes: string | null;
  source: RecordSource;
};

export type ProgramType =
  | "student-exchange"
  | "semester-exchange"
  | "pathway-programs"
  | "academic-visits";

export type Program = {
  id: ProgramType;
  name: string;
  type: ProgramType;
  description: string;
  generalAudience: string | null;
  source: RecordSource;
};

export type AvailabilityState = "open" | "closed" | "suspended";

/** A confirmed institution × programme pairing. Never generated as a cross-product. */
export type ProgramAvailability = {
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

export type Opportunity = {
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
  | "other";

export type DocumentStatus = "draft" | "under-review" | "final" | "archived";

export type DocumentRecord = {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  updatedOn: string | null;
  /** Object-storage key. Always null until file storage exists. */
  storageKey: string | null;
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

export type Activity = {
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
  | "not-recorded";

export type AgreementView = Agreement & {
  status: AgreementStatus;
  daysToExpiry: number | null;
  institution: Institution | null;
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
