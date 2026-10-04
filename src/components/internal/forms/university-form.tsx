"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import {
  describedBy,
  Field,
  FormStatus,
  SubmitButton,
  valueOf,
} from "@/components/internal/forms/form-fields";
import { saveInstitution } from "@/lib/internal/record-actions";
import { type RecordFormState, verificationOptions } from "@/lib/internal/record-forms";
import { verificationMeta } from "@/lib/internal/status";
import type { VerificationStatus } from "@/lib/internal/types";

export type UniversityFormInitial = {
  slug: string | null;
  name: string;
  normalizedName: string | null;
  countrySlug: string | null;
  city: string | null;
  website: string | null;
  note: string | null;
  isPublic: boolean;
  verification: VerificationStatus;
  sourceUrl: string | null;
};

export function UniversityForm({
  initial,
  countries,
  cancelHref,
}: {
  initial: UniversityFormInitial;
  countries: readonly { slug: string; name: string }[];
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState<RecordFormState, FormData>(saveInstitution, {});
  const id = useId();
  const errors = state.fieldErrors ?? {};
  const field = (name: string) => `${id}-${name}`;
  const isPublic = state.values ? state.values.isPublic === "on" : initial.isPublic;

  return (
    <form action={action} className="space-y-5 px-6 pt-2 pb-6" aria-busy={pending} noValidate>
      {initial.slug ? <input type="hidden" name="slug" value={initial.slug} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={field("name")} label="Name (as listed on the source)" error={errors.name} className="sm:col-span-2">
          <input
            {...describedBy(field("name"), errors.name, false, "h-9")}
            name="name"
            required
            maxLength={200}
            defaultValue={valueOf(state, "name", initial.name)}
          />
        </Field>
        <Field
          id={field("normalizedName")}
          label="Normalised name (optional)"
          error={errors.normalizedName}
          hint="Corrected spelling for search and headings."
        >
          <input
            {...describedBy(field("normalizedName"), errors.normalizedName, true, "h-9")}
            name="normalizedName"
            maxLength={200}
            defaultValue={valueOf(state, "normalizedName", initial.normalizedName)}
          />
        </Field>
        <Field id={field("country")} label="Country" error={errors.country}>
          <select
            {...describedBy(field("country"), errors.country, false, "h-9")}
            name="country"
            required
            defaultValue={valueOf(state, "country", initial.countrySlug)}
          >
            <option value="">Choose a country</option>
            {countries.map((country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
        </Field>
        <Field id={field("city")} label="Campus city (optional)" error={errors.city} hint="Leave blank unless a source states it.">
          <input
            {...describedBy(field("city"), errors.city, true, "h-9")}
            name="city"
            maxLength={120}
            defaultValue={valueOf(state, "city", initial.city)}
          />
        </Field>
        <Field id={field("website")} label="Website (optional)" error={errors.website}>
          <input
            {...describedBy(field("website"), errors.website, false, "h-9")}
            name="website"
            type="url"
            inputMode="url"
            placeholder="https://"
            maxLength={500}
            defaultValue={valueOf(state, "website", initial.website)}
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
        <Field id={field("note")} label="Review note (optional)" error={errors.note} className="sm:col-span-2">
          <textarea
            {...describedBy(field("note"), errors.note, false, "py-2")}
            name="note"
            rows={3}
            maxLength={2000}
            defaultValue={valueOf(state, "note", initial.note)}
          />
        </Field>
        <div className="sm:col-span-2">
          <label className="inline-flex items-center gap-2 text-[13px] text-foreground">
            <input type="checkbox" name="isPublic" defaultChecked={isPublic} className="size-4 rounded accent-[var(--muj)]" />
            Show on the public website
          </label>
          <p className="mt-1 text-[12px] text-fg-faint">
            Only for partners DoIC has confirmed; the public site lists the university, never its contacts.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <SubmitButton pending={pending}>{initial.slug ? "Save changes" : "Add university"}</SubmitButton>
        <Link href={cancelHref} className="text-[13px] text-fg-subtle hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
