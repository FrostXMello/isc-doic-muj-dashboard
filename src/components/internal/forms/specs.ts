import type { FieldGroup, FieldOption, FieldSpec } from "@/components/internal/forms/record-form";
import {
  activityStatusOptions,
  activityTypeOptions,
  availabilityOptions,
  documentStatusOptions,
  documentTypeOptions,
  opportunityStatusOptions,
  programTypeOptions,
} from "@/lib/internal/content-forms";
import type { EditOptions } from "@/lib/internal/data/editable";
import { verificationOptions } from "@/lib/internal/record-forms";
import {
  activityStatusMeta,
  activityTypeLabel,
  availabilityMeta,
  documentStatusMeta,
  documentTypeLabel,
  programTypeLabel,
  verificationMeta,
} from "@/lib/internal/status";

/** Field layouts for the record forms. Every field is a real column (see content-forms.ts). */

const opportunityRecordLabel = { draft: "Draft", published: "Published", archived: "Archived" } as const;

const opts = <K extends string>(keys: readonly K[], label: (key: K) => string): FieldOption[] =>
  keys.map((key) => ({ value: key, label: label(key) }));

const provenance: FieldGroup = {
  title: "Provenance",
  fields: [
    {
      kind: "select",
      name: "verification",
      label: "Verification",
      options: opts(verificationOptions, (key) => verificationMeta[key].label),
    },
    { kind: "url", name: "sourceUrl", label: "Source link (optional)", maxLength: 500 },
  ],
};

export function programGroups(creating: boolean, availableTypes: readonly string[]): FieldGroup[] {
  const typeField: FieldSpec[] = creating
    ? [
        {
          kind: "select",
          name: "type",
          label: "Programme type",
          placeholder: "Choose a type",
          required: true,
          options: opts(
            programTypeOptions.filter((type) => availableTypes.includes(type)),
            (key) => programTypeLabel[key],
          ),
          hint: "Each type has one programme record.",
        },
      ]
    : [];
  return [
    {
      fields: [
        ...typeField,
        { kind: "text", name: "name", label: "Name", required: true, maxLength: 120, wide: !creating },
        { kind: "textarea", name: "description", label: "Description", required: true, rows: 5, maxLength: 4000 },
        {
          kind: "text",
          name: "generalAudience",
          label: "Audience and eligibility (optional)",
          maxLength: 500,
          wide: true,
          hint: "Who the programme is for, in general terms. Offerings carry partner-specific eligibility.",
        },
        { kind: "number", name: "sortOrder", label: "Display order", min: 0, max: 999 },
        {
          kind: "checkbox",
          name: "isPublished",
          label: "Show on the public website",
          hint: "Unpublishing archives the programme without deleting it.",
        },
      ],
    },
    provenance,
  ];
}

export function offeringGroups(options: EditOptions): FieldGroup[] {
  return [
    {
      title: "Offering",
      fields: [
        { kind: "select", name: "program", label: "Programme", required: true, placeholder: "Choose a programme", options: options.programs },
        {
          kind: "select",
          name: "institution",
          label: "Partner university",
          required: true,
          placeholder: "Choose a university",
          options: options.institutions,
        },
        {
          kind: "select",
          name: "agreement",
          label: "Agreement (optional)",
          placeholder: "No agreement cited",
          options: options.agreements,
          wide: true,
          hint: "Must be an agreement whose lead partner is the university above.",
        },
        {
          kind: "select",
          name: "availability",
          label: "Availability",
          placeholder: "Not recorded",
          options: opts(availabilityOptions, (key) => availabilityMeta[key].label),
        },
        { kind: "text", name: "duration", label: "Duration (optional)", maxLength: 120 },
        { kind: "text", name: "intake", label: "Intake (optional)", maxLength: 120 },
        { kind: "date", name: "applicationStart", label: "Applications open (optional)" },
        { kind: "date", name: "applicationEnd", label: "Applications close (optional)" },
        { kind: "textarea", name: "eligibility", label: "Eligibility (optional)", maxLength: 2000 },
        { kind: "textarea", name: "creditInformation", label: "Credit information (optional)", maxLength: 2000 },
        { kind: "textarea", name: "notes", label: "Notes (optional)", maxLength: 2000 },
        {
          kind: "checkbox",
          name: "isPublished",
          label: "Show on the public website",
          hint: "Unpublishing archives the offering without deleting it.",
        },
      ],
    },
    provenance,
  ];
}

export function opportunityGroups(options: EditOptions): FieldGroup[] {
  return [
    {
      title: "Call",
      fields: [
        { kind: "text", name: "title", label: "Title", required: true, maxLength: 300, wide: true },
        { kind: "select", name: "program", label: "Programme", required: true, placeholder: "Choose a programme", options: options.programs },
        {
          kind: "select",
          name: "recordStatus",
          label: "Status",
          required: true,
          options: opts(opportunityStatusOptions, (key) => opportunityRecordLabel[key]),
          hint: "Draft calls stay internal. Published calls appear to students.",
        },
        {
          kind: "select",
          name: "offering",
          label: "Offering (optional)",
          placeholder: "Not tied to one offering",
          options: options.offerings,
          hint: "Must be an offering of the programme above.",
        },
        {
          kind: "select",
          name: "institution",
          label: "University (optional)",
          placeholder: "Not tied to one university",
          options: options.institutions,
        },
        { kind: "date", name: "opensOn", label: "Opens on (optional)" },
        { kind: "date", name: "deadline", label: "Deadline", hint: "Required to publish." },
        {
          kind: "textarea",
          name: "summary",
          label: "Summary: audience, eligibility, how to apply, links",
          required: true,
          rows: 5,
          maxLength: 4000,
        },
      ],
    },
    provenance,
  ];
}

export function activityGroups(options: EditOptions): FieldGroup[] {
  return [
    {
      title: "Activity",
      fields: [
        { kind: "text", name: "title", label: "Title", required: true, maxLength: 300, wide: true },
        {
          kind: "select",
          name: "type",
          label: "Type",
          required: true,
          placeholder: "Choose a type",
          options: opts(activityTypeOptions, (key) => activityTypeLabel[key]),
        },
        {
          kind: "select",
          name: "recordStatus",
          label: "Status",
          required: true,
          options: opts(activityStatusOptions, (key) => activityStatusMeta[key].label),
          hint: "Cancelling archives the activity without deleting it.",
        },
        { kind: "date", name: "startDate", label: "Start date", required: true },
        { kind: "date", name: "endDate", label: "End date (optional)" },
        { kind: "select", name: "country", label: "Country", required: true, placeholder: "Choose a country", options: options.countries },
        { kind: "text", name: "city", label: "City (optional)", maxLength: 120 },
        {
          kind: "select",
          name: "institution",
          label: "University (optional)",
          placeholder: "No university",
          options: options.institutions,
        },
        { kind: "select", name: "agreement", label: "Agreement (optional)", placeholder: "No agreement", options: options.agreements },
        { kind: "textarea", name: "summary", label: "Summary and outcome", required: true, rows: 4, maxLength: 4000 },
        { kind: "textarea", name: "participants", label: "Participants (optional)", maxLength: 1000 },
      ],
    },
    provenance,
  ];
}

export function documentGroups(options: EditOptions): FieldGroup[] {
  return [
    {
      title: "Document",
      fields: [
        { kind: "text", name: "title", label: "Title", required: true, maxLength: 300, wide: true },
        {
          kind: "select",
          name: "type",
          label: "Category",
          required: true,
          options: opts(documentTypeOptions, (key) => documentTypeLabel[key]),
          hint: "Reports are documents in the Report category.",
        },
        {
          kind: "select",
          name: "status",
          label: "Status",
          required: true,
          options: opts(documentStatusOptions, (key) => documentStatusMeta[key].label),
        },
        { kind: "date", name: "revisedOn", label: "Revised on (optional)" },
        { kind: "url", name: "externalUrl", label: "Link on an official site (optional)", maxLength: 500 },
        { kind: "textarea", name: "description", label: "Description (optional)", maxLength: 4000 },
        {
          kind: "checkbox",
          name: "publiclyAccessible",
          label: "The official link opens without signing in",
        },
      ],
    },
    {
      title: "Linked records",
      fields: [
        { kind: "select", name: "linkInstitution", label: "University", placeholder: "None", options: options.institutions },
        { kind: "select", name: "linkAgreement", label: "Agreement", placeholder: "None", options: options.agreements },
        { kind: "select", name: "linkProgram", label: "Programme", placeholder: "None", options: options.programs },
      ],
    },
    provenance,
  ];
}
