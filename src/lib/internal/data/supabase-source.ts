import "server-only";
import type { Dataset } from "@/lib/internal/data/dataset";
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
  Opportunity,
  OpportunityRecordStatus,
  Program,
  ProgramAvailability,
  ProgramType,
  RecordSource,
  Region,
  RenewalMode,
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

type CountryRow = {
  slug: string;
  name: string;
  hub_city: string | null;
  hub_latitude: number | null;
  hub_longitude: number | null;
  summary: string | null;
  region: { name: string } | null;
} | null;

type InstitutionRow = {
  slug: string;
  name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  note: string | null;
  data_source: RecordSource;
  country: CountryRow;
};

type AgreementRow = {
  code: string;
  reference: string;
  title: string;
  agreement_type: AgreementType;
  record_status: AgreementRecordStatus;
  start_date: string | null;
  end_date: string | null;
  renewal: RenewalMode | null;
  notes: string | null;
  data_source: RecordSource;
  institution: Ref<"slug">;
  areas: { position: number; area: Ref<"name"> }[];
};

type ProgramRow = {
  program_type: ProgramType;
  name: string;
  description: string;
  general_audience: string | null;
  data_source: RecordSource;
};

type AvailabilityRow = {
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

type OpportunityRow = {
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

type DocumentRow = {
  code: string;
  title: string;
  document_type: DocumentType;
  status: DocumentStatus;
  revised_on: string | null;
  storage_path: string | null;
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

type ActivityRow = {
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

const select = {
  institutions:
    "slug, name, city, latitude, longitude, website, note, data_source, " +
    "country:countries(slug, name, hub_city, hub_latitude, hub_longitude, summary, region:regions(name))",
  agreements:
    "code, reference, title, agreement_type, record_status, start_date, end_date, renewal, notes, data_source, " +
    "institution:institutions(slug), " +
    "areas:agreement_collaboration_areas(position, area:collaboration_areas(name))",
  programs: "program_type, name, description, general_audience, data_source",
  availability:
    "code, availability, duration, intake, application_start, application_end, eligibility, " +
    "credit_information, notes, data_source, " +
    "program:programs(program_type), institution:institutions(slug), agreement:agreements(code)",
  opportunities:
    "code, title, opens_on, deadline, record_status, summary, data_source, " +
    "program:programs(program_type), availability:program_availability(code), institution:institutions(slug)",
  documents: "code, title, document_type, status, revised_on, storage_path, description, data_source",
  documentLinks:
    "id, code, document:documents(code), institution:institutions(slug), agreement:agreements(code), " +
    "program:programs(program_type), availability:program_availability(code)",
  activities:
    "code, title, activity_type, record_status, start_date, end_date, city, summary, participants, data_source, " +
    "country:countries(name), institution:institutions(slug), agreement:agreements(code)",
} as const;

function toInstitution(row: InstitutionRow): Institution | null {
  const country = row.country;
  if (!country?.region) return null;
  // Directory rows only know the country pin; show it the way the static
  // source does (the UI labels it "country pin only").
  const fromDirectory = row.data_source === "directory";
  return {
    id: row.slug,
    name: row.name,
    country: country.name,
    countryId: country.slug,
    region: country.region.name as Region,
    city: row.city ?? country.hub_city ?? "",
    latitude: row.latitude ?? (fromDirectory ? country.hub_latitude : null),
    longitude: row.longitude ?? (fromDirectory ? country.hub_longitude : null),
    website: row.website,
    note: row.note ?? (fromDirectory ? country.summary : null),
    source: row.data_source,
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
    recordStatus: row.record_status,
    startDate: row.start_date,
    endDate: row.end_date,
    renewal: row.renewal,
    collaborationAreas: [...row.areas]
      .sort((a, b) => a.position - b.position)
      .flatMap((entry) => (entry.area ? [entry.area.name] : [])),
    notes: row.notes,
    source: row.data_source,
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
    description: row.description,
    source: row.data_source,
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
  };
}

function present<T>(value: T | null): value is T {
  return value !== null;
}

export async function loadSupabaseDataset(): Promise<Dataset> {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase is not configured.");
  const supabase = client;

  async function rows<T>(table: string, columns: string, orderBy: string): Promise<T[]> {
    const { data, error } = await supabase.from(table).select(columns).order(orderBy);
    if (error) throw new Error(`Supabase query on ${table} failed: ${error.message}`);
    return (data ?? []) as unknown as T[];
  }

  const [institutions, agreements, programs, availability, opportunities, documents, links, activities] =
    await Promise.all([
      rows<InstitutionRow>("institutions", select.institutions, "slug"),
      rows<AgreementRow>("agreements", select.agreements, "code"),
      rows<ProgramRow>("programs", select.programs, "sort_order"),
      rows<AvailabilityRow>("program_availability", select.availability, "code"),
      rows<OpportunityRow>("opportunities", select.opportunities, "code"),
      rows<DocumentRow>("documents", select.documents, "code"),
      rows<DocumentLinkRow>("document_links", select.documentLinks, "created_at"),
      rows<ActivityRow>("activities", select.activities, "code"),
    ]);

  return {
    institutions: institutions.map(toInstitution).filter(present),
    agreements: agreements.map(toAgreement).filter(present),
    programs: programs.map(toProgram),
    availability: availability.map(toAvailability).filter(present),
    opportunities: opportunities.map(toOpportunity).filter(present),
    documents: documents.map(toDocument),
    documentLinks: links.map(toDocumentLink).filter(present),
    activities: activities.map(toActivity).filter(present),
  };
}
