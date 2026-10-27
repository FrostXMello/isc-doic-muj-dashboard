"use client";

import { ChevronDown } from "lucide-react";
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

/** Every university value the portal shows; the add and edit pages use the same form. */
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
  sourceTitle: string | null;
  sourceCheckedOn: string | null;
  latitude: number | null;
  longitude: number | null;
};

export const emptyUniversity: UniversityFormInitial = {
  slug: null,
  name: "",
  normalizedName: null,
  countrySlug: null,
  city: null,
  website: null,
  note: null,
  isPublic: false,
  verification: "unverified",
  sourceUrl: null,
  sourceTitle: null,
  sourceCheckedOn: null,
  latitude: null,
  longitude: null,
};

const optionalFields = ["normalizedName", "sourceUrl", "sourceTitle", "sourceCheckedOn", "latitude", "longitude"] as const;

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
  const optionalOpen = optionalFields.some(
    (name) => errors[name] || (state.values?.[name] ?? initial[name]?.toString() ?? "") !== "",
  );

  const text = (name: keyof UniversityFormInitial, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field id={field(name)} label={label} error={errors[name]}>
      <input
        {...describedBy(field(name), errors[name], false, "h-9")}
        name={name}
        defaultValue={valueOf(state, name, initial[name]?.toString() ?? null)}
        {...props}
      />
    </Field>
  );

  return (
    <form action={action} className="space-y-6 px-4 sm:px-6 pt-2 pb-6" aria-busy={pending} noValidate>
      {initial.slug ? <input type="hidden" name="slug" value={initial.slug} /> : null}
      <FormStatus state={state} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{text("name", "Name", { required: true, maxLength: 200 })}</div>
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
        {text("city", "City", { maxLength: 120 })}
        {text("website", "Website", { type: "url", inputMode: "url", placeholder: "https://", maxLength: 500 })}
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
        <Field id={field("note")} label="Note" error={errors.note} className="sm:col-span-2">
          <textarea
            {...describedBy(field("note"), errors.note, false, "py-2")}
            name="note"
            rows={2}
            maxLength={2000}
            defaultValue={valueOf(state, "note", initial.note)}
          />
        </Field>
        <label className="inline-flex items-center gap-2 text-[13px] text-foreground sm:col-span-2">
          <input type="checkbox" name="isPublic" defaultChecked={isPublic} className="size-4 rounded accent-[var(--muj)]" />
          Show on the public website <span className="text-fg-faint">(name only, never contacts)</span>
        </label>
      </div>

      <details open={optionalOpen} className="group rounded-xl border border-hairline">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] text-fg-soft hover:text-foreground [&::-webkit-details-marker]:hidden">
          Source &amp; location <span className="text-fg-faint">(optional)</span>
          <ChevronDown
            className="ml-auto size-4 text-fg-dim transition-transform group-open:rotate-180 motion-reduce:transition-none"
            aria-hidden
          />
        </summary>
        <div className="grid gap-4 border-t border-hairline px-4 pt-3 pb-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {text("normalizedName", "Corrected spelling", { maxLength: 200 })}
          </div>
          {text("sourceUrl", "Source link", { type: "url", inputMode: "url", placeholder: "https://", maxLength: 500 })}
          {text("sourceTitle", "Source title", { maxLength: 300 })}
          {text("sourceCheckedOn", "Source last checked", { type: "date" })}
          <div className="grid grid-cols-2 gap-3">
            {text("latitude", "Latitude", { inputMode: "decimal", placeholder: "26.84" })}
            {text("longitude", "Longitude", { inputMode: "decimal", placeholder: "75.56" })}
          </div>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <SubmitButton pending={pending}>{initial.slug ? "Save changes" : "Add university"}</SubmitButton>
        <Link href={cancelHref} className="inline-flex min-h-10 items-center justify-center px-3 text-[13px] text-fg-subtle hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
