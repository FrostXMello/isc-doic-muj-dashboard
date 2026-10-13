"use server";

import { redirect } from "next/navigation";
import { agreementHref } from "@/lib/internal/links";
import { fieldError, type RecordFormState, SLUG_PATTERN } from "@/lib/internal/record-forms";
import { newContactCode, parseAgreementDetailsForm, parseContactForm } from "@/lib/internal/register-forms";
import {
  commonError,
  isState,
  notPermitted,
  refreshPortal,
  tryAgain,
  withValues,
  writableClient,
} from "@/lib/internal/write-context";

/**
 * Edits to the DoIC register: an agreement's register details and a
 * university's contacts. Writes run through the signed-in user's session, so
 * row level security is the boundary and every change is audited by the
 * table triggers.
 */

const notMigrated: RecordFormState = {
  error: "The DoIC register tables are not in this database yet. Apply the register migration first.",
};

function missingSchema(code: string | undefined) {
  return code === "42P01" || code === "42703" || code === "PGRST204" || code === "PGRST205";
}

export async function saveAgreementDetails(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = formData.get("code");
  const lead = formData.get("lead");
  if (typeof code !== "string" || !SLUG_PATTERN.test(code)) return { error: "Unknown agreement." };
  if (typeof lead !== "string" || !SLUG_PATTERN.test(lead)) return { error: "Unknown university." };

  const parsed = parseAgreementDetailsForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient("agreements:update");
  if (isState(writable)) return withValues(writable, formData);
  const { supabase } = writable;

  const { data: agreement, error: lookupError } = await supabase
    .from("agreements")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (lookupError) return withValues(tryAgain, formData);
  if (!agreement) return withValues(notPermitted, formData);

  const { error } = await supabase.from("agreement_details").upsert(
    {
      agreement_id: agreement.id,
      doic_reference: input.doicReference,
      initiation_year: input.initiationYear,
      renewal_year: input.renewalYear,
      period_text: input.periodText,
      expiry_text: input.expiryText,
      recorded_status: input.recordedStatus,
      qs_ranking: input.qsRanking,
      the_ranking: input.theRanking,
      faculty: input.faculty,
      department: input.department,
      opportunities: input.opportunities,
      programme_reference: input.programmeReference,
      remarks: input.remarks,
      document_url: input.documentUrl,
    },
    { onConflict: "agreement_id" },
  );
  if (error) {
    if (missingSchema(error.code)) return withValues(notMigrated, formData);
    return withValues(commonError(error) ?? tryAgain, formData);
  }

  refreshPortal();
  const href = agreementHref({ id: code, institutionId: lead });
  redirect(href.replace("#", "&notice=register-updated#"));
}

export async function saveContact(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const university = formData.get("university");
  const existing = formData.get("code");
  const editing = typeof existing === "string" && existing !== "";
  if (typeof university !== "string" || !SLUG_PATTERN.test(university)) return { error: "Unknown university." };
  if (editing && !SLUG_PATTERN.test(existing)) return { error: "Unknown contact." };

  const parsed = parseContactForm(formData);
  if (!parsed.ok) return parsed.state;
  const input = parsed.value;

  const writable = await writableClient("institutions:update");
  if (isState(writable)) return withValues(writable, formData);
  const { supabase } = writable;

  const { data: institution, error: institutionError } = await supabase
    .from("institutions")
    .select("id")
    .eq("slug", university)
    .maybeSingle();
  if (institutionError) return withValues(tryAgain, formData);
  if (!institution) return withValues(notPermitted, formData);

  let agreementId: string | null = null;
  if (input.agreementCode) {
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .select("id")
      .eq("code", input.agreementCode)
      .eq("institution_id", institution.id)
      .maybeSingle();
    if (agreementError) return withValues(tryAgain, formData);
    if (!agreement) return fieldError(formData, { agreement: "Choose one of this university's agreements." });
    agreementId = agreement.id as string;
  }

  const row = {
    institution_id: institution.id,
    agreement_id: agreementId,
    role_label: input.roleLabel,
    full_name: input.name,
    phone: input.phone,
    email: input.email,
    source_note: input.sourceNote,
  };
  const result = editing
    ? await supabase.from("institution_contacts").update(row).eq("code", existing).select("code")
    : await supabase.from("institution_contacts").insert({ ...row, code: newContactCode() }).select("code");
  if (result.error) {
    if (missingSchema(result.error.code)) return withValues(notMigrated, formData);
    return withValues(commonError(result.error) ?? tryAgain, formData);
  }
  if ((result.data ?? []).length === 0) return withValues(notPermitted, formData);

  refreshPortal();
  redirect(`/internal/universities/${university}?notice=${editing ? "contact-updated" : "contact-created"}#contacts`);
}

export async function deleteContact(_state: RecordFormState, formData: FormData): Promise<RecordFormState> {
  const code = formData.get("code");
  const university = formData.get("university");
  if (typeof code !== "string" || !SLUG_PATTERN.test(code)) return { error: "Unknown contact." };
  if (typeof university !== "string" || !SLUG_PATTERN.test(university)) return { error: "Unknown university." };
  if (formData.get("confirm") !== "on") return { error: "Tick the confirmation box to delete this contact." };

  const writable = await writableClient("institutions:delete");
  if (isState(writable)) return writable;
  const { data, error } = await writable.supabase.from("institution_contacts").delete().eq("code", code).select("code");
  if (error) return commonError(error) ?? tryAgain;
  if (!data || data.length === 0) return notPermitted;

  refreshPortal();
  redirect(`/internal/universities/${university}?notice=contact-deleted#contacts`);
}
