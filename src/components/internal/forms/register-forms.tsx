"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { describedBy, Field, FormStatus, SubmitButton, valueOf } from "@/components/internal/forms/form-fields";
import type { RecordFormState } from "@/lib/internal/record-forms";
import { saveAgreementDetails, saveContact } from "@/lib/internal/register-actions";
import { contactRoleSuggestions, detailTextLimits } from "@/lib/internal/register-forms";

export type AgreementDetailsInitial = {
  doicReference: string | null;
  initiationYear: number | null;
  renewalYear: number | null;
  periodText: string | null;
  expiryText: string | null;
  recordedStatus: string | null;
  qsRanking: string | null;
  theRanking: string | null;
  faculty: string | null;
  department: string | null;
  opportunities: string | null;
  programmeReference: string | null;
  remarks: string | null;
  documentUrl: string | null;
};

type TextKey = keyof typeof detailTextLimits;

const detailFields: { name: TextKey; label: string; hint?: string; long?: boolean }[] = [
  { name: "doicReference", label: "DoIC reference", hint: "DoIC/MoU or MoA/country/keyword/year/serial, as recorded." },
  { name: "recordedStatus", label: "Recorded status", hint: "As written in the register (Active, Expired, Closed)." },
  { name: "periodText", label: "Period", hint: "e.g. 5 years, Perpetual." },
  { name: "expiryText", label: "Expiry (text)", hint: "Only when the expiry is not a date, e.g. Perpetual." },
  { name: "qsRanking", label: "QS 2027 rank (override)" },
  { name: "theRanking", label: "THE ranking" },
  { name: "faculty", label: "Faculty" },
  { name: "department", label: "Department" },
  { name: "opportunities", label: "Opportunities mentioned in the MoU", long: true },
  { name: "programmeReference", label: "Summer school or similar programme", hint: "A link or text.", long: true },
  { name: "remarks", label: "Remarks", long: true },
];

export function AgreementDetailsForm({
  code,
  lead,
  initial,
  cancelHref,
  publishedQs = null,
}: {
  code: string;
  lead: string;
  initial: AgreementDetailsInitial;
  cancelHref: string;
  /** The university's rank in the published QS 2027 table, if any. */
  publishedQs?: string | null;
}) {
  const [state, action, pending] = useActionState<RecordFormState, FormData>(saveAgreementDetails, {});
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const field = (name: string) => `${id}-${name}`;

  return (
    <form action={action} className="space-y-5 px-4 sm:px-6 pt-2 pb-6" aria-busy={pending} noValidate>
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="lead" value={lead} />
      <FormStatus state={state} />
      <p className="text-[12px] text-fg-faint">
        Signing and expiry dates, status, and renewal mode are edited in the agreement details above; the portal works
        out active and expiring from those dates.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {(["initiationYear", "renewalYear"] as const).map((name) => (
          <Field
            key={name}
            id={field(name)}
            label={name === "initiationYear" ? "Year of initiation" : "Renewal year"}
            error={errors[name]}
          >
            <input
              {...describedBy(field(name), errors[name], false, "h-9 tabular-nums")}
              name={name}
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              defaultValue={valueOf(state, name, initial[name]?.toString() ?? null)}
            />
          </Field>
        ))}
        {detailFields.map(({ name, label, hint, long }) => (
          <Field
            key={name}
            id={field(name)}
            label={label}
            error={errors[name]}
            hint={
              name === "qsRanking"
                ? `Leave blank to show the published QS 2027 rank${publishedQs ? ` (${publishedQs})` : " (not ranked)"}.`
                : hint
            }
            className={long ? "sm:col-span-2" : undefined}
          >
            {long ? (
              <textarea
                {...describedBy(field(name), errors[name], Boolean(hint), "py-2")}
                name={name}
                rows={3}
                maxLength={detailTextLimits[name]}
                defaultValue={valueOf(state, name, initial[name])}
              />
            ) : (
              <input
                {...describedBy(field(name), errors[name], Boolean(hint) || name === "qsRanking", "h-9")}
                name={name}
                maxLength={detailTextLimits[name]}
                defaultValue={valueOf(state, name, initial[name])}
              />
            )}
          </Field>
        ))}
        <Field
          id={field("documentUrl")}
          label="Agreement file link"
          error={errors.documentUrl}
          hint="https link to the signed file in DoIC's access-controlled SharePoint. Never a public file share."
          className="sm:col-span-2"
        >
          <input
            {...describedBy(field("documentUrl"), errors.documentUrl, true, "h-9")}
            name="documentUrl"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={1000}
            defaultValue={valueOf(state, "documentUrl", initial.documentUrl)}
          />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <SubmitButton pending={pending}>Save register details</SubmitButton>
        <Link href={cancelHref} className="inline-flex min-h-10 items-center justify-center px-3 text-[13px] text-fg-subtle hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export type ContactInitial = {
  code: string | null;
  roleLabel: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  sourceNote: string | null;
  agreementCode: string | null;
};

export function ContactForm({
  university,
  agreements,
  initial,
  cancelHref,
}: {
  university: string;
  agreements: readonly { id: string; label: string }[];
  initial: ContactInitial;
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState<RecordFormState, FormData>(saveContact, {});
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const field = (name: string) => `${id}-${name}`;

  return (
    <form action={action} className="space-y-5 px-4 sm:px-6 pt-2 pb-6" aria-busy={pending} noValidate>
      <input type="hidden" name="university" value={university} />
      {initial.code ? <input type="hidden" name="code" value={initial.code} /> : null}
      <FormStatus state={state} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={field("roleLabel")} label="Role" error={errors.roleLabel} hint="e.g. MUJ Nodal Officer or Partner Nodal Officer.">
          <input
            {...describedBy(field("roleLabel"), errors.roleLabel, true, "h-9")}
            name="roleLabel"
            required
            maxLength={120}
            list={field("roles")}
            defaultValue={valueOf(state, "roleLabel", initial.roleLabel)}
          />
          <datalist id={field("roles")}>
            {contactRoleSuggestions.map((role) => (
              <option key={role} value={role} />
            ))}
          </datalist>
        </Field>
        <Field id={field("agreement")} label="Agreement" error={errors.agreement}>
          <select
            {...describedBy(field("agreement"), errors.agreement, false, "h-9")}
            name="agreement"
            defaultValue={valueOf(state, "agreement", initial.agreementCode)}
          >
            <option value="">The university (no single agreement)</option>
            {agreements.map((agreement) => (
              <option key={agreement.id} value={agreement.id}>
                {agreement.label}
              </option>
            ))}
          </select>
        </Field>
        <Field id={field("name")} label="Name" error={errors.name}>
          <input
            {...describedBy(field("name"), errors.name, false, "h-9")}
            name="name"
            maxLength={200}
            autoComplete="off"
            defaultValue={valueOf(state, "name", initial.name)}
          />
        </Field>
        <Field id={field("phone")} label="Phone" error={errors.phone}>
          <input
            {...describedBy(field("phone"), errors.phone, false, "h-9")}
            name="phone"
            type="tel"
            maxLength={60}
            autoComplete="off"
            defaultValue={valueOf(state, "phone", initial.phone)}
          />
        </Field>
        <Field id={field("email")} label="Email" error={errors.email}>
          <input
            {...describedBy(field("email"), errors.email, false, "h-9")}
            name="email"
            type="email"
            maxLength={320}
            autoComplete="off"
            defaultValue={valueOf(state, "email", initial.email)}
          />
        </Field>
        <Field
          id={field("sourceNote")}
          label="Note"
          error={errors.sourceNote}
          hint="Further addresses, extensions, or text that is not a phone number or email."
          className="sm:col-span-2"
        >
          <textarea
            {...describedBy(field("sourceNote"), errors.sourceNote, true, "py-2")}
            name="sourceNote"
            rows={2}
            maxLength={500}
            defaultValue={valueOf(state, "sourceNote", initial.sourceNote)}
          />
        </Field>
      </div>
      <p className="text-[12px] text-fg-faint">Contacts are internal to DoIC roles and never shown on the public site.</p>
      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <SubmitButton pending={pending}>{initial.code ? "Save contact" : "Add contact"}</SubmitButton>
        <Link href={cancelHref} className="inline-flex min-h-10 items-center justify-center px-3 text-[13px] text-fg-subtle hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
