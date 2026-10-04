"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { resolveInternalDataSource } from "@/lib/internal/data/source";
import { agreementHref } from "@/lib/internal/links";
import { type Permission, portalRoleOf, roleAllows } from "@/lib/internal/permissions";
import {
  fieldError,
  formValues,
  newAgreementCode,
  newInstitutionSlug,
  parseAgreementForm,
  parseInstitutionForm,
  type RecordFormState,
  SLUG_PATTERN,
} from "@/lib/internal/record-forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Create, update, and delete universities and their agreements (MoUs).
 *
 * Every write runs through the signed-in user's own Supabase session, so row
 * level security is the real boundary (isc_team and doic_admin write;
 * doic_admin deletes). The role checks here only give clear messages.
 */

const notPermitted: RecordFormState = { error: "Your role can't make this change." };
const unavailable: RecordFormState = {
  error: "Editing needs the Supabase data source, which isn't configured here.",
};
const tryAgain: RecordFormState = { error: "Couldn't save the change. Please try again." };

type PgError = { code?: string; message?: string } | null;

async function writableClient(permission: Permission): Promise<SupabaseClient | RecordFormState> {
  if (resolveInternalDataSource() !== "supabase") return unavailable;
  const auth = await getAuthContext();
  const role = auth.state === "signed-in" ? portalRoleOf(auth.roles) : null;
  if (!role || !roleAllows(role, permission)) return notPermitted;
  const supabase = await createSupabaseServerClient();
  return supabase ?? unavailable;
}

function isState(value: unknown): value is RecordFormState {
  return typeof value === "object" && value !== null && !("from" in value);
}

function withValues(state: RecordFormState, formData: FormData): RecordFormState {
  return { ...state, values: formValues(formData) };
}

function refreshPortal() {
  revalidatePath("/internal", "layout");
}

// ---------------------------------------------------------------------------
// Universities
// ---------------------------------------------------------------------------

export async function saveInstitution(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existingSlug = formData.get("slug");
  const editing = typeof existingSlug === "string" && existingSlug !== "";
  if (editing && !SLUG_PATTERN.test(existingSlug)) return { error: "Unknown university." };

  const parsed = parseInstitutionForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const supabase = await writableClient(editing ? "institutions:update" : "institutions:create");
  if (isState(supabase)) return withValues(supabase, formData);

  const { data: country, error: countryError } = await supabase
    .from("countries")
    .select("id")
    .eq("slug", input.countrySlug)
    .not("region_id", "is", null)
    .maybeSingle();
  if (countryError) return withValues(tryAgain, formData);
  if (!country) {
    return fieldError(formData, { country: "Choose a country." });
  }

  const row = {
    name: input.name,
    normalized_name: input.normalizedName,
    country_id: country.id,
    city: input.city,
    website: input.website,
    note: input.note,
    is_public: input.isPublic,
    verification: input.verification,
    source_url: input.sourceUrl,
  };

  let slug = editing ? existingSlug : newInstitutionSlug(input.name);
  let error: PgError;
  if (editing) {
    const result = await supabase.from("institutions").update(row).eq("slug", slug).select("slug");
    error = result.error;
    if (!error && (result.data ?? []).length === 0) return withValues(notPermitted, formData);
  } else {
    let result = await supabase.from("institutions").insert({ ...row, slug }).select("slug");
    // A slug collision is astronomically unlikely; retry once with a new suffix.
    if (result.error?.code === "23505" && result.error.message?.includes("slug")) {
      slug = newInstitutionSlug(input.name);
      result = await supabase.from("institutions").insert({ ...row, slug }).select("slug");
    }
    error = result.error;
  }

  if (error) {
    if (error.code === "23505") {
      return fieldError(formData, { name: "A university with this name is already recorded in that country." });
    }
    if (error.code === "42501") return withValues(notPermitted, formData);
    if (error.code === "23514") return withValues({ error: "One of the values isn't allowed. Check the links and country." }, formData);
    return withValues(tryAgain, formData);
  }

  refreshPortal();
  redirect(`/internal/universities/${slug}?notice=${editing ? "university-updated" : "university-created"}`);
}

export async function deleteInstitution(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const slug = formData.get("slug");
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) return { error: "Unknown university." };
  if (formData.get("confirm") !== "on") return { error: "Tick the confirmation box to delete this university." };

  const supabase = await writableClient("institutions:delete");
  if (isState(supabase)) return supabase;

  const { data, error } = await supabase.from("institutions").delete().eq("slug", slug).select("slug");
  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "This university still has MoUs, partner links, programme offerings, or application calls. Delete or move those first.",
      };
    }
    return tryAgain;
  }
  if (!data || data.length === 0) return notPermitted;

  refreshPortal();
  redirect("/internal/universities?notice=university-deleted");
}

// ---------------------------------------------------------------------------
// Agreements (MoUs)
// ---------------------------------------------------------------------------

async function institutionIds(supabase: SupabaseClient, slugs: string[]) {
  if (slugs.length === 0) return new Map<string, string>();
  const { data, error } = await supabase.from("institutions").select("id, slug").in("slug", slugs);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.slug as string, row.id as string]));
}

export async function saveAgreement(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const existingCode = formData.get("code");
  const editing = typeof existingCode === "string" && existingCode !== "";
  if (editing && !SLUG_PATTERN.test(existingCode)) return { error: "Unknown agreement." };

  const parsed = parseAgreementForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const supabase = await writableClient(editing ? "agreements:update" : "agreements:create");
  if (isState(supabase)) return withValues(supabase, formData);

  let ids: Map<string, string>;
  try {
    ids = await institutionIds(supabase, [input.leadSlug, ...input.partnerSlugs]);
  } catch {
    return withValues(tryAgain, formData);
  }
  const leadId = ids.get(input.leadSlug);
  if (!leadId) {
    return fieldError(formData, { lead: "Choose the lead university." });
  }
  if (input.partnerSlugs.some((slug) => !ids.has(slug))) {
    return fieldError(formData, { partners: "Unknown university." });
  }

  const row = {
    institution_id: leadId,
    title: input.title,
    reference: input.reference,
    agreement_type: input.type,
    type_label: input.typeLabel,
    record_status: input.recordStatus,
    start_date: input.startDate,
    end_date: input.endDate,
    renewal: input.renewal,
    notes: input.notes,
    verification: input.verification,
    source_url: input.sourceUrl,
  };

  const code = editing ? existingCode : newAgreementCode();
  const result = editing
    ? await supabase.from("agreements").update(row).eq("code", code).select("id")
    : await supabase.from("agreements").insert({ ...row, code }).select("id");

  if (result.error) {
    const { code: pgCode, message = "" } = result.error;
    if (pgCode === "23505" && message.includes("reference")) {
      return fieldError(formData, { reference: "Another agreement already uses this reference." });
    }
    if (pgCode === "23503") {
      return withValues(
        {
          error:
            "Programme offerings or contacts are tied to this agreement's current lead university, so it can't be moved. Unlink them first.",
        },
        formData,
      );
    }
    if (pgCode === "23514") {
      return fieldError(formData, { endDate: "The end date can't be before the start date." });
    }
    if (pgCode === "42501") return withValues(notPermitted, formData);
    return withValues(tryAgain, formData);
  }
  const agreementId = result.data?.[0]?.id as string | undefined;
  if (!agreementId) return withValues(notPermitted, formData);

  const partnerError = await syncPartners(
    supabase,
    agreementId,
    input.partnerSlugs.map((slug) => ids.get(slug) as string),
  );

  refreshPortal();
  if (partnerError) {
    return {
      error: "The agreement was saved, but its partner universities couldn't be updated. Open it again and retry.",
    };
  }
  const href = agreementHref({ id: code, institutionId: input.leadSlug });
  redirect(href.replace("#", `&notice=${editing ? "agreement-updated" : "agreement-created"}#`));
}

/** Makes the agreement's additional partners exactly `wanted`. */
async function syncPartners(supabase: SupabaseClient, agreementId: string, wanted: string[]) {
  const { data, error } = await supabase
    .from("agreement_partner_institutions")
    .select("institution_id")
    .eq("agreement_id", agreementId);
  if (error) return error;

  const current = new Set((data ?? []).map((row) => row.institution_id as string));
  const target = new Set(wanted);
  const remove = [...current].filter((id) => !target.has(id));
  const add = [...target].filter((id) => !current.has(id));

  if (remove.length > 0) {
    const { error: deleteError } = await supabase
      .from("agreement_partner_institutions")
      .delete()
      .eq("agreement_id", agreementId)
      .in("institution_id", remove);
    if (deleteError) return deleteError;
  }
  if (add.length > 0) {
    const { error: insertError } = await supabase
      .from("agreement_partner_institutions")
      .insert(add.map((institution_id) => ({ agreement_id: agreementId, institution_id })));
    if (insertError) return insertError;
  }
  return null;
}

export async function deleteAgreement(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = formData.get("code");
  const lead = formData.get("lead");
  if (typeof code !== "string" || !SLUG_PATTERN.test(code)) return { error: "Unknown agreement." };
  if (typeof lead !== "string" || !SLUG_PATTERN.test(lead)) return { error: "Unknown university." };
  if (formData.get("confirm") !== "on") return { error: "Tick the confirmation box to delete this agreement." };

  const supabase = await writableClient("agreements:delete");
  if (isState(supabase)) return supabase;

  const { data, error } = await supabase.from("agreements").delete().eq("code", code).select("code");
  if (error) {
    if (error.code === "23503") {
      return { error: "Programme offerings cite this agreement. Remove that link before deleting it." };
    }
    return tryAgain;
  }
  if (!data || data.length === 0) return notPermitted;

  refreshPortal();
  redirect(`/internal/universities/${lead}?notice=agreement-deleted`);
}
