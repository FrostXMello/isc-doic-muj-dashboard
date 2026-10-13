import "server-only";
import { openDataContext } from "@/lib/internal/data/context";
import { programTypeLabel } from "@/lib/internal/status";
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
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Exact rows for edit forms, read as the signed-in user (RLS applies). Edit
 * pages render only with the Supabase source, so these return null without it.
 */

type Ref<K extends string> = { [key in K]: string } | null;

type Provenance = { verification: VerificationStatus; source_url: string | null };

async function client() {
  const { source } = await openDataContext();
  return source === "supabase" ? createSupabaseServerClient() : null;
}

async function single<T>(table: string, columns: string, column: string, key: string): Promise<T | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select(columns).eq(column, key).maybeSingle();
  if (error) throw new Error(`Supabase query on ${table} failed: ${error.message}`);
  return (data as T | null) ?? null;
}

export type EditableProgram = Provenance & {
  program_type: ProgramType;
  name: string;
  description: string;
  general_audience: string | null;
  is_published: boolean;
  sort_order: number;
};

export function loadProgramForEdit(type: string) {
  return single<EditableProgram>(
    "programs",
    "program_type, name, description, general_audience, is_published, sort_order, verification, source_url",
    "program_type",
    type,
  );
}

export type EditableOffering = Provenance & {
  code: string;
  availability: AvailabilityState | null;
  duration: string | null;
  intake: string | null;
  application_start: string | null;
  application_end: string | null;
  eligibility: string | null;
  credit_information: string | null;
  notes: string | null;
  is_published: boolean;
  program: Ref<"program_type">;
  institution: Ref<"slug">;
  agreement: Ref<"code">;
};

export function loadOfferingForEdit(code: string) {
  return single<EditableOffering>(
    "program_availability",
    "code, availability, duration, intake, application_start, application_end, eligibility, credit_information, " +
      "notes, is_published, verification, source_url, program:programs(program_type), " +
      "institution:institutions(slug), agreement:agreements(code)",
    "code",
    code,
  );
}

export type EditableOpportunity = Provenance & {
  code: string;
  title: string;
  opens_on: string | null;
  deadline: string | null;
  record_status: OpportunityRecordStatus;
  summary: string;
  program: Ref<"program_type">;
  availability: Ref<"code">;
  institution: Ref<"slug">;
};

export function loadOpportunityForEdit(code: string) {
  return single<EditableOpportunity>(
    "opportunities",
    "code, title, opens_on, deadline, record_status, summary, verification, source_url, " +
      "program:programs(program_type), availability:program_availability(code), institution:institutions(slug)",
    "code",
    code,
  );
}

export type EditableActivity = Provenance & {
  code: string;
  title: string;
  activity_type: ActivityType;
  record_status: ActivityRecordStatus;
  start_date: string;
  end_date: string | null;
  city: string | null;
  summary: string;
  participants: string | null;
  country: Ref<"slug">;
  institution: Ref<"slug">;
  agreement: Ref<"code">;
};

export function loadActivityForEdit(code: string) {
  return single<EditableActivity>(
    "activities",
    "code, title, activity_type, record_status, start_date, end_date, city, summary, participants, verification, " +
      "source_url, country:countries(slug), institution:institutions(slug), agreement:agreements(code)",
    "code",
    code,
  );
}

export type EditableDocument = Provenance & {
  id: string;
  code: string;
  title: string;
  document_type: DocumentType;
  status: DocumentStatus;
  revised_on: string | null;
  description: string | null;
  external_url: string | null;
  publicly_accessible: boolean;
  storage_path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  links: { institution: Ref<"slug">; agreement: Ref<"code">; program: Ref<"program_type"> }[];
};

export function loadDocumentForEdit(code: string) {
  return single<EditableDocument>(
    "documents",
    "id, code, title, document_type, status, revised_on, description, external_url, publicly_accessible, " +
      "storage_path, mime_type, size_bytes, verification, source_url, " +
      "links:document_links(institution:institutions(slug), agreement:agreements(code), program:programs(program_type))",
    "code",
    code,
  );
}

export type Option = { value: string; label: string };

/** Select options for record forms, from the same dataset the portal shows. */
export async function listEditOptions() {
  const { data } = await openDataContext();
  const institutionName = new Map(data.institutions.map((row) => [row.id, row.name]));
  const supabase = await client();
  let countries: Option[] = [];
  if (supabase) {
    const { data: rows, error } = await supabase.from("countries").select("slug, name").order("name");
    if (error) throw new Error(`Supabase query on countries failed: ${error.message}`);
    countries = (rows ?? []).map((row) => ({ value: row.slug as string, label: row.name as string }));
  }
  const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label);

  return {
    countries,
    institutions: data.institutions
      .map((row) => ({ value: row.id, label: `${row.name} — ${row.country}` }))
      .sort(byLabel),
    agreements: data.agreements
      .map((row) => ({
        value: row.id,
        label: `${row.title} (${row.reference})`,
        institution: row.institutionId,
      }))
      .sort(byLabel),
    programs: data.programs.map((row) => ({ value: row.id, label: row.name || programTypeLabel[row.id] })),
    offerings: data.availability
      .map((row) => ({
        value: row.id,
        label: `${programTypeLabel[row.programId]} — ${institutionName.get(row.institutionId) ?? row.institutionId}`,
        program: row.programId,
      }))
      .sort(byLabel),
  };
}

export type EditOptions = Awaited<ReturnType<typeof listEditOptions>>;
