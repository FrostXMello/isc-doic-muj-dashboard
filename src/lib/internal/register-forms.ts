/**
 * Parsing for the DoIC register forms: an agreement's register details and a
 * university's contacts. Pure, so it can be unit-tested; the database
 * enforces the same limits (supabase/migrations/20261013090000_mou_workbook.sql
 * and the institution_contacts checks), and RLS decides who may write.
 */

import { fail, optional, type Parsed, SLUG_PATTERN, text } from "@/lib/internal/record-forms";
import { PHONE_PATTERN } from "@/lib/internal/workbook/source";

export type AgreementDetailsInput = {
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

/** Field name -> maximum length, matching the table's checks. */
export const detailTextLimits = {
  doicReference: 200,
  periodText: 100,
  expiryText: 100,
  recordedStatus: 60,
  qsRanking: 60,
  theRanking: 60,
  faculty: 200,
  department: 200,
  opportunities: 4000,
  programmeReference: 1000,
  remarks: 4000,
} as const;

const HTTPS_URL = /^https:\/\/\S+$/i;

function year(formData: FormData, key: string, errors: Record<string, string>) {
  const value = text(formData, key);
  if (!value) return null;
  if (!/^\d{4}$/.test(value) || Number(value) < 1950 || Number(value) > 2100) {
    errors[key] = "Enter a four-digit year between 1950 and 2100.";
    return null;
  }
  return Number(value);
}

export function parseAgreementDetailsForm(formData: FormData): Parsed<AgreementDetailsInput> {
  const errors: Record<string, string> = {};
  const values = Object.fromEntries(
    Object.entries(detailTextLimits).map(([key, limit]) => {
      const value = text(formData, key);
      if (value.length > limit) errors[key] = `Use at most ${limit} characters.`;
      return [key, optional(value)];
    }),
  ) as Record<keyof typeof detailTextLimits, string | null>;
  const initiationYear = year(formData, "initiationYear", errors);
  const renewalYear = year(formData, "renewalYear", errors);
  const documentUrl = text(formData, "documentUrl");
  if (documentUrl && (!HTTPS_URL.test(documentUrl) || documentUrl.length > 1000)) {
    errors.documentUrl = "Enter a full link starting with https://.";
  }
  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return { ok: true, value: { ...values, initiationYear, renewalYear, documentUrl: optional(documentUrl) } };
}

export type ContactInput = {
  roleLabel: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  sourceNote: string | null;
  agreementCode: string | null;
};

export const contactRoleSuggestions = ["MUJ Nodal Officer", "MUJ Nodal Officer (earlier)", "Partner Nodal Officer"];

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function parseContactForm(formData: FormData): Parsed<ContactInput> {
  const errors: Record<string, string> = {};
  const roleLabel = text(formData, "roleLabel");
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const email = text(formData, "email");
  const sourceNote = text(formData, "sourceNote");
  const agreementCode = text(formData, "agreement");

  if (!roleLabel) errors.roleLabel = "Enter the contact's role, e.g. MUJ Nodal Officer.";
  else if (roleLabel.length > 120) errors.roleLabel = "Use at most 120 characters.";
  if (name.length > 200) errors.name = "Use at most 200 characters.";
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = "Use digits, spaces, and + ( ) , . / - only (6–60 characters). Put extensions or other text in the note.";
  }
  if (email && (!EMAIL.test(email) || email.length > 320)) errors.email = "Enter one valid email address. Put others in the note.";
  if (sourceNote.length > 500) errors.sourceNote = "Use at most 500 characters.";
  if (agreementCode && !SLUG_PATTERN.test(agreementCode)) errors.agreement = "Unknown agreement.";
  if (!errors.name && !errors.phone && !errors.email && !name && !phone && !email) {
    errors.name = "Enter at least a name, a phone number, or an email address.";
  }

  if (Object.keys(errors).length > 0) return fail(formData, errors);
  return {
    ok: true,
    value: {
      roleLabel,
      name: optional(name),
      phone: optional(phone),
      email: optional(email.toLowerCase()),
      sourceNote: optional(sourceNote),
      agreementCode: optional(agreementCode),
    },
  };
}

export function newContactCode(random: () => number = Math.random) {
  const part = () =>
    Math.floor(random() * 36 ** 4)
      .toString(36)
      .padStart(4, "0");
  return `ct-${part()}${part()}`;
}
