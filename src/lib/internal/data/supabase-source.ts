import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type Dataset, sampleDataEnabled } from "@/lib/internal/data/dataset";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Activity,
  ActivityRecordStatus,
  ActivityType,
  Agreement,
  AgreementRecordStatus,
  AgreementType,
  AvailabilityState,
  DocumentLink,
  DocumentRecord,
  DocumentStatus,
  DocumentType,
  Institution,
  InstitutionContact,
  Opportunity,
  OpportunityRecordStatus,
  Program,
  ProgramAvailability,
  ProgramType,
  RecordSource,
  Region,
  RenewalMode,
  VerificationStatus,
  Provenance,
} from "@/lib/internal/types";

/**
 * Loads the Internal Portal dataset from Supabase as the current user.
 *
 * Rows map onto the existing entity types, using each table's `slug`/`code`
 * as the entity id so URLs such as /internal/mous/agr-001 keep working.
 * Row level security decides what is returned. A row whose required parent
 * is not visible to the user (for example an offering whose institution is
 * hidden) is left out rather than shown half-empty.
 */

type Ref<K extends string> = { [key in K]: string } | null;

type ProvenanceRow = {
  source_url: string | null;
  source_title: string | null;
  source_checked_on: string | null;
  verification: VerificationStatus;
};

function toProvenance(row: ProvenanceRow): Provenance {
  return {
    sourceUrl: row.source_url,
    sourceTitle: row.source_title,
    sourceCheckedOn: row.source_checked_on,
    verification: row.verification,
  };
}

type CountryRow = {
  slug: string;
  name: string;
  region: { name: string } | null;
} | null;

type InstitutionRow = ProvenanceRow & {
  slug: string;
  name: string;
  normalized_name: string | null;
  is_public: boolean;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  note: string | null;
  data_source: RecordSource;
  country: CountryRow;
};

type AgreementRow = ProvenanceRow & {
  code: string;
  reference: string;
  title: string;
  agreement_type: AgreementType;
  type_label: string | null;
  source_section: string | null;
  record_status: AgreementRecordStatus;
  start_date: string | null;
  end_date: string | null;
  renewal: RenewalMode | null;
  notes: string | null;
  data_source: RecordSource;
  institution: Ref<"slug">;
  areas: { position: number; area: Ref<"name"> }[];
};

type ProgramRow = ProvenanceRow & {
  program_type: ProgramType;
  name: string;
  description: string;
  general_audience: string | null;
  data_source: RecordSource;
};

type AvailabilityRow = ProvenanceRow & {
  code: string;
  availability: AvailabilityState | null;
  duration: string | null;
  intake: string | null;
  application_start: string | null;
  application_end: string | null;
  eligibility: string | null;
  credit_information: string | null;
  notes: string | null;
  data_source: RecordSource;
  program: Ref<"program_type">;
  institution: Ref<"slug">;
  agreement: Ref<"code">;
};

type OpportunityRow = ProvenanceRow & {
  code: string;
  title: string;
  opens_on: string | null;
  deadline: string | null;
  record_status: OpportunityRecordStatus;
  summary: string;
  data_source: RecordSource;
  program: Ref<"program_type">;
  availability: Ref<"code">;
  institution: Ref<"slug">;
};

type DocumentRow = ProvenanceRow & {
  code: string;
  title: string;
  document_type: DocumentType;
  status: DocumentStatus;
  revised_on: string | null;
  storage_path: string | null;
  external_url: string | null;
  publicly_accessible: boolean;
  description: string | null;
  data_source: RecordSource;
};

type DocumentLinkRow = {
  id: string;
  code: string | null;
  document: Ref<"code">;
  institution: Ref<"slug">;
  agreement: Ref<"code">;
  program: Ref<"program_type">;
  availability: Ref<"code">;
};

type ActivityRow = ProvenanceRow & {
  code: string;
  title: string;
  activity_type: ActivityType;
  record_status: ActivityRecordStatus;
  start_date: string;
  end_date: string | null;
  city: string | null;
  summary: string;
  participants: string | null;
  data_source: RecordSource;
  country: Ref<"name">;
  institution: Ref<"slug">;
  agreement: Ref<"code">;
};

const provenanceColumns = "source_url, source_title, source_checked_on, verification";

const select = {
  institutions:
    `slug, name, normalized_name, city, latitude, longitude, website, note, is_public, data_source, ${provenanceColumns}, ` +
    "country:countries(slug, name, region:regions(name))",
  agreements:
    "code, reference, title, agreement_type, type_label, source_section, record_status, start_date, end_date, " +
    `renewal, notes, data_source, ${provenanceColumns}, ` +
    "institution:institutions!agreements_institution_id_fkey(slug), " +
    "areas:agreement_collaboration_areas(position, area:collaboration_areas(name))",
  programs: `program_type, name, description, general_audience, data_source, ${provenanceColumns}`,
  availability:
    "code, availability, duration, intake, application_start, application_end, eligibility, " +
    `credit_information, notes, data_source, ${provenanceColumns}, ` +
    "program:programs(program_type), institution:institutions(slug), agreement:agreements(code)",
  opportunities:
    `code, title, opens_on, deadline, record_status, summary, data_source, ${provenanceColumns}, ` +
    "program:programs(program_type), availability:program_availability(code), institution:institutions(slug)",
  documents:
    "code, title, document_type, status, revised_on, storage_path, external_url, publicly_accessible, " +
    `description, data_source, ${provenanceColumns}`,
  documentLinks:
    "id, code, document:documents(code), institution:institutions(slug), agreement:agreements(code), " +
    "program:programs(program_type), availability:program_availability(code)",
  activities:
    "code, title, activity_type, record_status, start_date, end_date, city, summary, participants, " +
    `data_source, ${provenanceColumns}, ` +
    "country:countries(name), institution:institutions(slug), agreement:agreements(code)",
} as const;

function toInstitution(row: InstitutionRow): Institution | null {
  const country = row.country;
  if (!country?.region) return null;
  return {
    id: row.slug,
    name: row.name,
    normalizedName: row.normalized_name,
    country: country.name,
    countryId: country.slug,
    region: country.region.name as Region,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    website: row.website,
    note: row.note,
    isPublic: row.is_public,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function toAgreement(row: AgreementRow): Agreement | null {
  if (!row.institution) return null;
  return {
    id: row.code,
    reference: row.reference,
    institutionId: row.institution.slug,
    title: row.title,
    type: row.agreement_type,
    typeLabel: row.type_label,
    recordStatus: row.record_status,
    startDate: row.start_date,
    endDate: row.end_date,
    renewal: row.renewal,
    collaborationAreas: [...row.areas]
      .sort((a, b) => a.position - b.position)
      .flatMap((entry) => (entry.area ? [entry.area.name] : [])),
    sourceSection: row.source_section,
    notes: row.notes,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function toProgram(row: ProgramRow): Program {
  return {
    id: row.program_type,
    name: row.name,
    type: row.program_type,
    description: row.description,
    generalAudience: row.general_audience,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function toAvailability(row: AvailabilityRow): ProgramAvailability | null {
  if (!row.program || !row.institution) return null;
  return {
    id: row.code,
    programId: row.program.program_type as ProgramType,
    institutionId: row.institution.slug,
    agreementId: row.agreement?.code ?? null,
    availability: row.availability,
    duration: row.duration,
    intake: row.intake,
    applicationStart: row.application_start,
    applicationEnd: row.application_end,
    eligibility: row.eligibility,
    creditInformation: row.credit_information,
    notes: row.notes,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function toOpportunity(row: OpportunityRow): Opportunity | null {
  if (!row.program) return null;
  return {
    id: row.code,
    title: row.title,
    programId: row.program.program_type as ProgramType,
    availabilityId: row.availability?.code ?? null,
    institutionId: row.institution?.slug ?? null,
    opensOn: row.opens_on,
    deadline: row.deadline,
    recordStatus: row.record_status,
    summary: row.summary,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function toDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.code,
    title: row.title,
    type: row.document_type,
    status: row.status,
    updatedOn: row.revised_on,
    storageKey: row.storage_path,
    url: row.external_url,
    publiclyAccessible: row.publicly_accessible,
    description: row.description,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function toDocumentLink(row: DocumentLinkRow): DocumentLink | null {
  if (!row.document) return null;
  return {
    id: row.code ?? row.id,
    documentId: row.document.code,
    institutionId: row.institution?.slug ?? null,
    agreementId: row.agreement?.code ?? null,
    programId: (row.program?.program_type as ProgramType | undefined) ?? null,
    availabilityId: row.availability?.code ?? null,
  };
}

function toActivity(row: ActivityRow): Activity | null {
  if (!row.country) return null;
  return {
    id: row.code,
    title: row.title,
    type: row.activity_type,
    startDate: row.start_date,
    endDate: row.end_date,
    institutionId: row.institution?.slug ?? null,
    country: row.country.name,
    city: row.city,
    recordStatus: row.record_status,
    summary: row.summary,
    participants: row.participants,
    agreementId: row.agreement?.code ?? null,
    source: row.data_source,
    ...toProvenance(row),
  };
}

function present<T>(value: T | null): value is T {
  return value !== null;
}

type ContactRow = {
  code: string;
  role_label: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  visibility: "internal" | "public";
  institution: Ref<"slug">;
  agreement: Ref<"code">;
};

const INTERNAL_ROLES = new Set(["isc_team", "doic_admin", "leadership"]);

export type SupabaseLoad = {
  data: Dataset;
  /** The signed-in user holds an internal role (isc_team, doic_admin, leadership). */
  internalRole: boolean;
  contacts: InstitutionContact[];
};

export async function loadSupabaseDataset(): Promise<SupabaseLoad> {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase is not configured.");
  return readSupabaseDataset(client);
}

/** Reads the dataset through any user-scoped client; RLS decides what is returned. */
export async function readSupabaseDataset(supabase: SupabaseClient): Promise<SupabaseLoad> {
  async function rows<T>(table: string, columns: string, orderBy: string): Promise<T[]> {
    const { data, error } = await supabase.from(table).select(columns).order(orderBy);
    if (error) throw new Error(`Supabase query on ${table} failed: ${error.message}`);
    return (data ?? []) as unknown as T[];
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let internalRole = false;
  if (user) {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (error) throw new Error(`Supabase query on user_roles failed: ${error.message}`);
    internalRole = (roles ?? []).some((row) => INTERNAL_ROLES.has(String(row.role)));
  }

  const [institutions, agreements, programs, availability, opportunities, documents, links, activities, contacts] =
    await Promise.all([
      rows<InstitutionRow>("institutions", select.institutions, "slug"),
      rows<AgreementRow>("agreements", select.agreements, "code"),
      rows<ProgramRow>("programs", select.programs, "sort_order"),
      rows<AvailabilityRow>("program_availability", select.availability, "code"),
      rows<OpportunityRow>("opportunities", select.opportunities, "code"),
      rows<DocumentRow>("documents", select.documents, "code"),
      rows<DocumentLinkRow>("document_links", select.documentLinks, "created_at"),
      rows<ActivityRow>("activities", select.activities, "code"),
      // Contacts are only requested for internal roles; RLS enforces the same.
      internalRole
        ? rows<ContactRow>(
            "institution_contacts",
            "code, role_label, full_name, phone, email, visibility, " +
              "institution:institutions(slug), agreement:agreements(code)",
            "code",
          )
        : Promise.resolve([] as ContactRow[]),
    ]);

  const keep = <T extends { source: RecordSource }>(row: T) =>
    sampleDataEnabled() || row.source !== "sample";

  return {
    data: {
      institutions: institutions.map(toInstitution).filter(present).filter(keep),
      agreements: agreements.map(toAgreement).filter(present).filter(keep),
      programs: programs.map(toProgram),
      availability: availability.map(toAvailability).filter(present).filter(keep),
      opportunities: opportunities.map(toOpportunity).filter(present).filter(keep),
      documents: documents.map(toDocument).filter(keep),
      documentLinks: links.map(toDocumentLink).filter(present),
      activities: activities.map(toActivity).filter(present).filter(keep),
    },
    internalRole,
    contacts: contacts.flatMap((row) =>
      row.institution
        ? [
            {
              id: row.code,
              institutionId: row.institution.slug,
              agreementId: row.agreement?.code ?? null,
              roleLabel: row.role_label,
              name: row.full_name,
              phone: row.phone,
              email: row.email,
              visibility: row.visibility,
            },
          ]
        : [],
    ),
  };
}
