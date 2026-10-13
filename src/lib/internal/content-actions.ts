"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  DOCUMENT_BUCKET,
  checkDocumentFile,
  isDocumentObjectPath,
  newRecordCode,
  parseActivityForm,
  parseDocumentForm,
  parseOfferingForm,
  parseOpportunityForm,
  parseProgramForm,
  parseSettingsForm,
} from "@/lib/internal/content-forms";
import type { ContentResource } from "@/lib/internal/permissions";
import { fieldError, type RecordFormState, SLUG_PATTERN } from "@/lib/internal/record-forms";
import {
  commonError,
  isState,
  notPermitted,
  type PgError,
  refreshPortal,
  tryAgain,
  withValues,
  writableClient,
} from "@/lib/internal/write-context";

/**
 * Create, update, archive, and delete programmes, offerings, opportunities,
 * activities, documents (with their stored files), and portal settings.
 *
 * Every write runs as the signed-in user, so row level security decides it:
 * editors create, edit, and archive; administrators delete. Child rows are
 * never cascaded away silently: deletes that other records depend on are
 * refused by foreign keys and reported, with archiving offered instead.
 */

type Ids = Map<string, string>;

async function idsBy(supabase: SupabaseClient, table: string, column: string, keys: (string | null)[]): Promise<Ids> {
  const wanted = [...new Set(keys.filter((key): key is string => Boolean(key)))];
  if (wanted.length === 0) return new Map();
  const { data, error } = await supabase.from(table).select(`id, ${column}`).in(column, wanted);
  if (error) throw error;
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  return new Map(rows.map((row) => [String(row[column]), String(row.id)]));
}

function existingKey(formData: FormData, name: string): string | null | false {
  const value = formData.get(name);
  if (value === null || value === "") return null;
  return typeof value === "string" && SLUG_PATTERN.test(value) ? value : false;
}

function confirmed(formData: FormData) {
  return formData.get("confirm") === "on";
}

function saveError(error: NonNullable<PgError>, formData: FormData): RecordFormState {
  return withValues(commonError(error) ?? tryAgain, formData);
}

/** Runs a confirmed delete and reports dependants instead of cascading them. */
async function deleteBy(
  permission: `${ContentResource}:delete`,
  table: string,
  column: string,
  key: string,
  dependants: string,
): Promise<RecordFormState | null> {
  const writable = await writableClient(permission);
  if (isState(writable)) return writable;
  const { data, error } = await writable.supabase.from(table).delete().eq(column, key).select("id");
  if (error) {
    if (error.code === "23503") return { error: `${dependants} Remove or move those first, or archive this record instead.` };
    return commonError(error) ?? tryAgain;
  }
  if (!data || data.length === 0) return notPermitted;
  return null;
}

// ---------------------------------------------------------------------------
// Programmes
// ---------------------------------------------------------------------------

export async function saveProgram(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existing = existingKey(formData, "existing");
  if (existing === false) return { error: "Unknown programme." };
  if (existing) formData.set("type", existing);
  const parsed = parseProgramForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient(existing ? "programs:update" : "programs:create");
  if (isState(writable)) return withValues(writable, formData);
  const row = {
    name: input.name,
    description: input.description,
    general_audience: input.generalAudience,
    is_published: input.isPublished,
    sort_order: input.sortOrder,
    verification: input.verification,
    source_url: input.sourceUrl,
  };
  const result = existing
    ? await writable.supabase.from("programs").update(row).eq("program_type", existing).select("id")
    : await writable.supabase
        .from("programs")
        .insert({ ...row, slug: input.type, program_type: input.type })
        .select("id");
  if (result.error) {
    if (result.error.code === "23505") return fieldError(formData, { type: "This programme already exists." });
    return saveError(result.error, formData);
  }
  if ((result.data ?? []).length === 0) return withValues(notPermitted, formData);

  refreshPortal();
  redirect(`/internal/programs/${input.type}?notice=${existing ? "programme-updated" : "programme-created"}`);
}

export async function deleteProgram(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const type = existingKey(formData, "existing");
  if (!type) return { error: "Unknown programme." };
  if (!confirmed(formData)) return { error: "Tick the confirmation box to delete this programme." };
  const failure = await deleteBy("programs:delete", "programs", "program_type", type,
    "Offerings or application calls still belong to this programme.");
  if (failure) return failure;
  refreshPortal();
  redirect("/internal/programs?notice=programme-deleted");
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

export async function saveOffering(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existing = existingKey(formData, "existing");
  if (existing === false) return { error: "Unknown offering." };
  const parsed = parseOfferingForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient(existing ? "programs:update" : "programs:create");
  if (isState(writable)) return withValues(writable, formData);
  const { supabase } = writable;

  let programs: Ids, institutions: Ids;
  let agreement: { id: string; institution_id: string } | null = null;
  try {
    [programs, institutions] = await Promise.all([
      idsBy(supabase, "programs", "program_type", [input.programType]),
      idsBy(supabase, "institutions", "slug", [input.institutionSlug]),
    ]);
    if (input.agreementCode) {
      const { data, error } = await supabase
        .from("agreements")
        .select("id, institution_id")
        .eq("code", input.agreementCode)
        .maybeSingle();
      if (error) throw error;
      agreement = data;
    }
  } catch {
    return withValues(tryAgain, formData);
  }
  const programId = programs.get(input.programType);
  const institutionId = institutions.get(input.institutionSlug);
  if (!programId) return fieldError(formData, { program: "Choose a programme." });
  if (!institutionId) return fieldError(formData, { institution: "Choose a university." });
  if (input.agreementCode && (!agreement || agreement.institution_id !== institutionId)) {
    return fieldError(formData, { agreement: "Choose an agreement whose lead partner is this university." });
  }

  const row = {
    program_id: programId,
    institution_id: institutionId,
    agreement_id: agreement?.id ?? null,
    availability: input.availability,
    duration: input.duration,
    intake: input.intake,
    application_start: input.applicationStart,
    application_end: input.applicationEnd,
    eligibility: input.eligibility,
    credit_information: input.creditInformation,
    notes: input.notes,
    is_published: input.isPublished,
    verification: input.verification,
    source_url: input.sourceUrl,
  };
  const code = existing || newRecordCode("off");
  const result = existing
    ? await supabase.from("program_availability").update(row).eq("code", code).select("id")
    : await supabase.from("program_availability").insert({ ...row, code }).select("id");
  if (result.error) {
    if (result.error.code === "23505") {
      return fieldError(formData, { institution: "This university already has an offering of this programme." });
    }
    if (result.error.code === "23503") {
      return withValues({ error: "Application calls are tied to this offering's programme, so it can't change. Unlink them first." }, formData);
    }
    return saveError(result.error, formData);
  }
  if ((result.data ?? []).length === 0) return withValues(notPermitted, formData);

  refreshPortal();
  redirect(`/internal/programs/${code}?notice=${existing ? "offering-updated" : "offering-created"}`);
}

export async function deleteOffering(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = existingKey(formData, "existing");
  if (!code) return { error: "Unknown offering." };
  if (!confirmed(formData)) return { error: "Tick the confirmation box to delete this offering." };
  const failure = await deleteBy("programs:delete", "program_availability", "code", code,
    "Application calls still cite this offering.");
  if (failure) return failure;
  refreshPortal();
  redirect("/internal/programs?notice=offering-deleted");
}

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

export async function saveOpportunity(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existing = existingKey(formData, "existing");
  if (existing === false) return { error: "Unknown call." };
  const parsed = parseOpportunityForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient(existing ? "opportunities:update" : "opportunities:create");
  if (isState(writable)) return withValues(writable, formData);
  const { supabase } = writable;

  let programs: Ids, institutions: Ids;
  let offering: { id: string; program_id: string } | null = null;
  try {
    [programs, institutions] = await Promise.all([
      idsBy(supabase, "programs", "program_type", [input.programType]),
      idsBy(supabase, "institutions", "slug", [input.institutionSlug]),
    ]);
    if (input.offeringCode) {
      const { data, error } = await supabase
        .from("program_availability")
        .select("id, program_id")
        .eq("code", input.offeringCode)
        .maybeSingle();
      if (error) throw error;
      offering = data;
    }
  } catch {
    return withValues(tryAgain, formData);
  }
  const programId = programs.get(input.programType);
  if (!programId) return fieldError(formData, { program: "Choose a programme." });
  if (input.institutionSlug && !institutions.has(input.institutionSlug)) {
    return fieldError(formData, { institution: "Choose a university." });
  }
  if (input.offeringCode && (!offering || offering.program_id !== programId)) {
    return fieldError(formData, { offering: "Choose an offering of the selected programme." });
  }

  const row = {
    title: input.title,
    program_id: programId,
    availability_id: offering?.id ?? null,
    institution_id: input.institutionSlug ? institutions.get(input.institutionSlug) : null,
    opens_on: input.opensOn,
    deadline: input.deadline,
    record_status: input.recordStatus,
    summary: input.summary,
    verification: input.verification,
    source_url: input.sourceUrl,
  };
  const code = existing || newRecordCode("opp");
  const result = existing
    ? await supabase.from("opportunities").update(row).eq("code", code).select("id")
    : await supabase.from("opportunities").insert({ ...row, code }).select("id");
  if (result.error) return saveError(result.error, formData);
  if ((result.data ?? []).length === 0) return withValues(notPermitted, formData);

  refreshPortal();
  redirect(`/internal/opportunities/${code}?notice=${existing ? "call-updated" : "call-created"}`);
}

export async function deleteOpportunity(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = existingKey(formData, "existing");
  if (!code) return { error: "Unknown call." };
  if (!confirmed(formData)) return { error: "Tick the confirmation box to delete this call." };
  const failure = await deleteBy("opportunities:delete", "opportunities", "code", code,
    "Students have applied to this call.");
  if (failure) return failure;
  refreshPortal();
  redirect("/internal/programs?tab=opportunities&notice=call-deleted");
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export async function saveActivity(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existing = existingKey(formData, "existing");
  if (existing === false) return { error: "Unknown activity." };
  const parsed = parseActivityForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient(existing ? "activities:update" : "activities:create");
  if (isState(writable)) return withValues(writable, formData);
  const { supabase } = writable;

  let countries: Ids, institutions: Ids, agreements: Ids;
  try {
    [countries, institutions, agreements] = await Promise.all([
      idsBy(supabase, "countries", "slug", [input.countrySlug]),
      idsBy(supabase, "institutions", "slug", [input.institutionSlug]),
      idsBy(supabase, "agreements", "code", [input.agreementCode]),
    ]);
  } catch {
    return withValues(tryAgain, formData);
  }
  const countryId = countries.get(input.countrySlug);
  if (!countryId) return fieldError(formData, { country: "Choose a country." });
  if (input.institutionSlug && !institutions.has(input.institutionSlug)) {
    return fieldError(formData, { institution: "Choose a university." });
  }
  if (input.agreementCode && !agreements.has(input.agreementCode)) {
    return fieldError(formData, { agreement: "Choose an agreement." });
  }

  const row = {
    title: input.title,
    activity_type: input.type,
    record_status: input.recordStatus,
    start_date: input.startDate,
    end_date: input.endDate,
    country_id: countryId,
    city: input.city,
    institution_id: input.institutionSlug ? institutions.get(input.institutionSlug) : null,
    agreement_id: input.agreementCode ? agreements.get(input.agreementCode) : null,
    summary: input.summary,
    participants: input.participants,
    verification: input.verification,
    source_url: input.sourceUrl,
  };
  const code = existing || newRecordCode("act");
  const result = existing
    ? await supabase.from("activities").update(row).eq("code", code).select("id")
    : await supabase.from("activities").insert({ ...row, code }).select("id");
  if (result.error) return saveError(result.error, formData);
  if ((result.data ?? []).length === 0) return withValues(notPermitted, formData);

  refreshPortal();
  redirect(`/internal/activities/${code}?notice=${existing ? "activity-updated" : "activity-created"}`);
}

export async function deleteActivity(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = existingKey(formData, "existing");
  if (!code) return { error: "Unknown activity." };
  if (!confirmed(formData)) return { error: "Tick the confirmation box to delete this activity." };
  const failure = await deleteBy("activities:delete", "activities", "code", code, "Other records cite this activity.");
  if (failure) return failure;
  refreshPortal();
  redirect("/internal/activities?notice=activity-deleted");
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

type LinkTarget = "institution_id" | "agreement_id" | "program_id";

/** Makes the document's university / agreement / programme links exactly `wanted`. */
async function syncDocumentLinks(supabase: SupabaseClient, documentId: string, wanted: Partial<Record<LinkTarget, string>>) {
  const { data, error } = await supabase
    .from("document_links")
    .select("id, institution_id, agreement_id, program_id")
    .eq("document_id", documentId);
  if (error) return error;
  const targets: LinkTarget[] = ["institution_id", "agreement_id", "program_id"];
  for (const target of targets) {
    const current = (data ?? []).filter((row) => row[target]);
    const stale = current.filter((row) => row[target] !== wanted[target]).map((row) => row.id as string);
    if (stale.length > 0) {
      const { error: deleteError } = await supabase.from("document_links").delete().in("id", stale);
      if (deleteError) return deleteError;
    }
    const value = wanted[target];
    if (value && !current.some((row) => row[target] === value)) {
      const { error: insertError } = await supabase.from("document_links").insert({ document_id: documentId, [target]: value });
      if (insertError) return insertError;
    }
  }
  return null;
}

export async function saveDocument(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existing = existingKey(formData, "existing");
  if (existing === false) return { error: "Unknown document." };
  const parsed = parseDocumentForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient(existing ? "documents:update" : "documents:create");
  if (isState(writable)) return withValues(writable, formData);
  const { supabase } = writable;

  let institutions: Ids, agreements: Ids, programs: Ids;
  try {
    [institutions, agreements, programs] = await Promise.all([
      idsBy(supabase, "institutions", "slug", [input.links.institutionSlug]),
      idsBy(supabase, "agreements", "code", [input.links.agreementCode]),
      idsBy(supabase, "programs", "program_type", [input.links.programType]),
    ]);
  } catch {
    return withValues(tryAgain, formData);
  }
  const wanted: Partial<Record<LinkTarget, string>> = {};
  if (input.links.institutionSlug) {
    const id = institutions.get(input.links.institutionSlug);
    if (!id) return fieldError(formData, { linkInstitution: "Choose a university." });
    wanted.institution_id = id;
  }
  if (input.links.agreementCode) {
    const id = agreements.get(input.links.agreementCode);
    if (!id) return fieldError(formData, { linkAgreement: "Choose an agreement." });
    wanted.agreement_id = id;
  }
  if (input.links.programType) {
    const id = programs.get(input.links.programType);
    if (!id) return fieldError(formData, { linkProgram: "Choose a programme." });
    wanted.program_id = id;
  }

  const row = {
    title: input.title,
    document_type: input.type,
    status: input.status,
    revised_on: input.revisedOn,
    description: input.description,
    external_url: input.externalUrl,
    publicly_accessible: input.publiclyAccessible,
    verification: input.verification,
    source_url: input.sourceUrl,
  };
  const code = existing || newRecordCode("doc");
  const result = existing
    ? await supabase.from("documents").update(row).eq("code", code).select("id")
    : await supabase.from("documents").insert({ ...row, code }).select("id");
  if (result.error) return saveError(result.error, formData);
  const documentId = result.data?.[0]?.id as string | undefined;
  if (!documentId) return withValues(notPermitted, formData);

  const linkError = await syncDocumentLinks(supabase, documentId, wanted);
  refreshPortal();
  if (linkError) {
    return { error: "The document was saved, but its links couldn't be updated. Open it again and retry." };
  }
  redirect(`/internal/documents/${code}?notice=${existing ? "document-updated" : "document-created"}`);
}

/**
 * Records a file the browser has just uploaded to Storage (as the signed-in
 * user, so storage RLS checked the role and path). The path must belong to
 * this document and the object must exist. Earlier files stay in Storage as
 * prior versions; administrators may remove them.
 */
export async function attachDocumentFile(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = existingKey(formData, "existing");
  const path = formData.get("path");
  const mime = formData.get("mime");
  const size = Number(formData.get("size"));
  if (!code || typeof path !== "string" || typeof mime !== "string") return { error: "Unknown upload." };
  const fileError = checkDocumentFile({ size, type: mime });
  if (fileError) return { error: fileError };

  const writable = await writableClient("documents:upload");
  if (isState(writable)) return writable;
  const { supabase } = writable;

  const { data: document, error } = await supabase.from("documents").select("id").eq("code", code).maybeSingle();
  if (error || !document) return { error: "Unknown document." };
  if (!isDocumentObjectPath(document.id, path)) return { error: "That upload doesn't belong to this document." };

  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data: objects, error: listError } = await supabase.storage.from(DOCUMENT_BUCKET).list(folder, { search: name });
  if (listError) return tryAgain;
  if (!(objects ?? []).some((object) => object.name === name)) return { error: "The upload didn't complete. Try again." };

  const { data: updated, error: updateError } = await supabase
    .from("documents")
    .update({ storage_bucket: DOCUMENT_BUCKET, storage_path: path, mime_type: mime, size_bytes: size })
    .eq("id", document.id)
    .select("id");
  if (updateError) return commonError(updateError) ?? tryAgain;
  if (!updated || updated.length === 0) return notPermitted;

  refreshPortal();
  return {};
}

async function removeObjects(supabase: SupabaseClient, documentId: string) {
  const folder = `documents/${documentId}`;
  const { data } = await supabase.storage.from(DOCUMENT_BUCKET).list(folder);
  const paths = (data ?? []).map((object) => `${folder}/${object.name}`);
  if (paths.length === 0) return null;
  const { error } = await supabase.storage.from(DOCUMENT_BUCKET).remove(paths);
  return error;
}

export async function deleteDocument(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = existingKey(formData, "existing");
  if (!code) return { error: "Unknown document." };
  if (!confirmed(formData)) return { error: "Tick the confirmation box to delete this document." };

  const writable = await writableClient("documents:delete");
  if (isState(writable)) return writable;
  const { supabase } = writable;
  const { data, error } = await supabase.from("documents").delete().eq("code", code).select("id");
  if (error) return commonError(error) ?? tryAgain;
  if (!data || data.length === 0) return notPermitted;

  const storageError = await removeObjects(supabase, data[0].id as string);
  refreshPortal();
  if (storageError) {
    redirect("/internal/documents?notice=document-deleted-files-kept");
  }
  redirect("/internal/documents?notice=document-deleted");
}

// ---------------------------------------------------------------------------
// Archive and restore (reversible alternative to deleting)
// ---------------------------------------------------------------------------

type ArchiveKind = "opportunity" | "document" | "activity" | "offering" | "programme";

const archiveRules: Record<
  ArchiveKind,
  {
    resource: ContentResource;
    table: string;
    key: string;
    archive: Record<string, unknown>;
    restore: Record<string, unknown>;
    href: (key: string) => string;
  }
> = {
  opportunity: {
    resource: "opportunities",
    table: "opportunities",
    key: "code",
    archive: { record_status: "archived" },
    restore: { record_status: "draft" },
    href: (key) => `/internal/opportunities/${key}`,
  },
  document: {
    resource: "documents",
    table: "documents",
    key: "code",
    archive: { status: "archived" },
    restore: { status: "draft" },
    href: (key) => `/internal/documents/${key}`,
  },
  activity: {
    resource: "activities",
    table: "activities",
    key: "code",
    archive: { record_status: "cancelled" },
    restore: { record_status: "planned" },
    href: (key) => `/internal/activities/${key}`,
  },
  offering: {
    resource: "programs",
    table: "program_availability",
    key: "code",
    archive: { is_published: false },
    restore: { is_published: true },
    href: (key) => `/internal/programs/${key}`,
  },
  programme: {
    resource: "programs",
    table: "programs",
    key: "program_type",
    archive: { is_published: false },
    restore: { is_published: true },
    href: (key) => `/internal/programs/${key}`,
  },
};

export async function archiveRecord(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const kind = formData.get("kind");
  const intent = formData.get("intent");
  const key = existingKey(formData, "existing");
  if (typeof kind !== "string" || !(kind in archiveRules) || !key) return { error: "Unknown record." };
  if (intent !== "archive" && intent !== "restore") return { error: "Unknown change." };
  const rule = archiveRules[kind as ArchiveKind];

  const writable = await writableClient(`${rule.resource}:archive`);
  if (isState(writable)) return writable;
  const { data, error } = await writable.supabase
    .from(rule.table)
    .update(intent === "archive" ? rule.archive : rule.restore)
    .eq(rule.key, key)
    .select("id");
  if (error) return commonError(error) ?? tryAgain;
  if (!data || data.length === 0) return notPermitted;

  refreshPortal();
  redirect(`${rule.href(key)}?notice=${intent === "archive" ? "record-archived" : "record-restored"}`);
}

// ---------------------------------------------------------------------------
// Portal settings
// ---------------------------------------------------------------------------

export async function saveSettings(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const parsed = parseSettingsForm(formData);
  if (!parsed.ok) return parsed.state;
  const writable = await writableClient("settings:update");
  if (isState(writable)) return withValues(writable, formData);

  const { data, error } = await writable.supabase
    .from("portal_settings")
    .update({
      access_contact_email: parsed.value.accessContactEmail,
      access_contact_note: parsed.value.accessContactNote,
    })
    .eq("id", true)
    .select("id");
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return withValues({ error: "Settings need the latest database migration (20261005090100_admin_control)." }, formData);
    }
    if (error.code === "23514") return fieldError(formData, { accessContactEmail: "Enter a valid email address." });
    return saveError(error, formData);
  }
  if (!data || data.length === 0) return withValues(notPermitted, formData);

  refreshPortal();
  redirect("/internal/admin/settings?notice=settings-saved");
}
