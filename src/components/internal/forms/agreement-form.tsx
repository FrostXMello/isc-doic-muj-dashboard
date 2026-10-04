"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState } from "react";
import {
  describedBy,
  Field,
  FormStatus,
  inputClass,
  labelClass,
  SubmitButton,
  valueOf,
} from "@/components/internal/forms/form-fields";
import { saveAgreement } from "@/lib/internal/record-actions";
import {
  agreementRecordStatusLabel,
  agreementRecordStatusOptions,
  agreementTypeOptions,
  MAX_PARTNERS,
  type RecordFormState,
  renewalOptions,
  verificationOptions,
} from "@/lib/internal/record-forms";
import { agreementTypeLabel, verificationMeta } from "@/lib/internal/status";
import type {
  AgreementRecordStatus,
  AgreementType,
  RenewalMode,
  VerificationStatus,
} from "@/lib/internal/types";
import { cn } from "@/lib/utils";

export type AgreementFormInitial = {
  code: string | null;
  leadSlug: string;
  partnerSlugs: readonly string[];
  title: string;
  reference: string;
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

type InstitutionOption = { id: string; name: string; country: string };

const renewalLabel: Record<RenewalMode, string> = {
  automatic: "Renews automatically unless ended",
  "by-review": "Renewed after review",
};

export function AgreementForm({
  initial,
  institutions,
  cancelHref,
}: {
  initial: AgreementFormInitial;
  institutions: readonly InstitutionOption[];
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState<RecordFormState, FormData>(saveAgreement, {});
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const field = (name: string) => `${id}-${name}`;
  const lead = valueOf(state, "lead", initial.leadSlug);
  const submittedPartners = state.values?.partners;
  const partners = new Set(Array.isArray(submittedPartners) ? submittedPartners : initial.partnerSlugs);

  return (
    <form action={action} className="space-y-5 px-5 py-5" aria-busy={pending} noValidate>
      {initial.code ? <input type="hidden" name="code" value={initial.code} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={field("title")} label="Title" error={errors.title} className="sm:col-span-2">
          <input
            {...describedBy(field("title"), errors.title, false, "h-9")}
            name="title"
            required
            maxLength={300}
            defaultValue={valueOf(state, "title", initial.title)}
          />
        </Field>
        <Field
          id={field("reference")}
          label="Reference"
          error={errors.reference}
          hint="The agreement's file or document number. Must be unique."
        >
          <input
            {...describedBy(field("reference"), errors.reference, true, "h-9 font-mono")}
            name="reference"
            required
            maxLength={80}
            defaultValue={valueOf(state, "reference", initial.reference)}
          />
        </Field>
        <Field id={field("lead")} label="Lead university" error={errors.lead}>
          <select
            {...describedBy(field("lead"), errors.lead, false, "h-9")}
            name="lead"
            required
            defaultValue={lead}
          >
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.name} · {institution.country}
              </option>
            ))}
          </select>
        </Field>
        <Field id={field("type")} label="Agreement type" error={errors.type}>
          <select
            {...describedBy(field("type"), errors.type, false, "h-9")}
            name="type"
            required
            defaultValue={valueOf(state, "type", initial.type)}
          >
            {agreementTypeOptions.map((value) => (
              <option key={value} value={value}>
                {agreementTypeLabel[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field
          id={field("typeLabel")}
          label="Wording on the document (optional)"
          error={errors.typeLabel}
          hint="Quote the agreement's own name for its type, if it has one."
        >
          <input
            {...describedBy(field("typeLabel"), errors.typeLabel, true, "h-9")}
            name="typeLabel"
            maxLength={200}
            defaultValue={valueOf(state, "typeLabel", initial.typeLabel)}
          />
        </Field>
        <Field
          id={field("recordStatus")}
          label="Recorded status"
          error={errors.recordStatus}
          hint="Active, expiring, and expired are worked out from the dates of signed agreements."
        >
          <select
            {...describedBy(field("recordStatus"), errors.recordStatus, true, "h-9")}
            name="recordStatus"
            required
            defaultValue={valueOf(state, "recordStatus", initial.recordStatus)}
          >
            {agreementRecordStatusOptions.map((value) => (
              <option key={value} value={value}>
                {agreementRecordStatusLabel[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={field("renewal")} label="Renewal" error={errors.renewal}>
          <select
            {...describedBy(field("renewal"), errors.renewal, false, "h-9")}
            name="renewal"
            defaultValue={valueOf(state, "renewal", initial.renewal)}
          >
            <option value="">Not recorded</option>
            {renewalOptions.map((value) => (
              <option key={value} value={value}>
                {renewalLabel[value]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={field("startDate")} label="Start date (optional)" error={errors.startDate}>
          <input
            {...describedBy(field("startDate"), errors.startDate, false, "h-9")}
            name="startDate"
            type="date"
            defaultValue={valueOf(state, "startDate", initial.startDate)}
          />
        </Field>
        <Field id={field("endDate")} label="Expiry date (optional)" error={errors.endDate}>
          <input
            {...describedBy(field("endDate"), errors.endDate, false, "h-9")}
            name="endDate"
            type="date"
            defaultValue={valueOf(state, "endDate", initial.endDate)}
          />
        </Field>
        <Field id={field("verification")} label="Verification" error={errors.verification}>
          <select
            {...describedBy(field("verification"), errors.verification, false, "h-9")}
            name="verification"
            defaultValue={valueOf(state, "verification", initial.verification)}
          >
            {verificationOptions.map((value) => (
              <option key={value} value={value}>
                {verificationMeta[value].label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={field("sourceUrl")} label="Source link (optional)" error={errors.sourceUrl}>
          <input
            {...describedBy(field("sourceUrl"), errors.sourceUrl, false, "h-9")}
            name="sourceUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
            defaultValue={valueOf(state, "sourceUrl", initial.sourceUrl)}
          />
        </Field>
        <Field id={field("notes")} label="Notes (optional)" error={errors.notes} className="sm:col-span-2">
          <textarea
            {...describedBy(field("notes"), errors.notes, false, "py-2")}
            name="notes"
            rows={3}
            maxLength={4000}
            defaultValue={valueOf(state, "notes", initial.notes)}
          />
        </Field>
        <PartnerPicker
          id={field("partners")}
          institutions={institutions}
          initialLead={lead}
          selected={partners}
          error={errors.partners}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <SubmitButton pending={pending}>{initial.code ? "Save changes" : "Add agreement"}</SubmitButton>
        <Link href={cancelHref} className="text-[13px] text-fg-subtle hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}

/**
 * Further universities that are parties to the same agreement. Filtering only
 * hides rows, so ticked boxes stay in the form.
 */
function PartnerPicker({
  id,
  institutions,
  initialLead,
  selected,
  error,
}: {
  id: string;
  institutions: readonly InstitutionOption[];
  initialLead: string;
  selected: ReadonlySet<string>;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(selected.size);
  const needle = query.trim().toLowerCase();

  return (
    <fieldset className="sm:col-span-2" aria-describedby={error ? `${id}-error` : `${id}-hint`}>
      <legend className={labelClass}>Additional partner universities (optional)</legend>
      <p id={`${id}-hint`} className="mt-1 text-[12px] text-fg-faint">
        Only for agreements signed with more than one university. {count} selected · up to {MAX_PARTNERS}.
      </p>
      <div className="relative mt-2">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-faint" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter universities"
          aria-label="Filter partner universities"
          className={cn(inputClass, "mt-0 h-9 border-line pl-9")}
        />
      </div>
      <ul
        className="mt-2 max-h-56 divide-y divide-hairline overflow-y-auto overscroll-contain rounded-lg border border-line"
        onChange={(event) => {
          const list = event.currentTarget;
          setCount(list.querySelectorAll('input[name="partners"]:checked').length);
        }}
      >
        {institutions.map((institution) => {
          const hidden =
            institution.id === initialLead ||
            (needle !== "" &&
              !institution.name.toLowerCase().includes(needle) &&
              !institution.country.toLowerCase().includes(needle));
          return (
            <li key={institution.id} hidden={hidden}>
              <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-foreground hover:bg-overlay-subtle">
                <input
                  type="checkbox"
                  name="partners"
                  value={institution.id}
                  defaultChecked={selected.has(institution.id) && institution.id !== initialLead}
                  className="accent-cyan"
                />
                <span className="min-w-0 flex-1 truncate">{institution.name}</span>
                <span className="shrink-0 text-[12px] text-fg-faint">{institution.country}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[12px] text-danger-fg">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
