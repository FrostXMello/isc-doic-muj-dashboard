/** Pure helpers for presenting audit log entries. */

export const auditTableLabels: Record<string, string> = {
  "auth.users": "Accounts",
  user_roles: "Role grants",
  profiles: "Account status",
  portal_settings: "Portal settings",
  institutions: "Universities",
  institution_contacts: "University contacts",
  agreements: "MoUs and agreements",
  agreement_partner_institutions: "Agreement partners",
  agreement_collaboration_areas: "Agreement areas",
  collaboration_areas: "Collaboration areas",
  programs: "Programmes",
  program_availability: "Programme offerings",
  opportunities: "Calls",
  documents: "Documents",
  document_links: "Document links",
  activities: "Activities",
  applications: "Applications",
  regions: "Regions",
  countries: "Countries",
};

export const auditActions = ["INSERT", "UPDATE", "DELETE"] as const;
export type AuditAction = (typeof auditActions)[number];

export const auditActionLabels: Record<AuditAction, string> = {
  INSERT: "Created",
  UPDATE: "Changed",
  DELETE: "Deleted",
};

const SECRET_KEY = /pass(word)?|token|secret|hash|otp|recovery/i;
const IGNORED_KEYS = new Set(["updated_at", "created_at"]);
const MAX_VALUE_LENGTH = 160;

export type AuditChange = { field: string; before: string | null; after: string | null };

function show(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (SECRET_KEY.test(key)) return "[redacted]";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH - 1)}…` : text;
}

/**
 * Field-level before/after for one entry: changed fields for updates, every
 * set field for inserts and deletes. Secret-looking keys are always redacted.
 */
export function auditChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
): AuditChange[] {
  const keys = [...new Set([...Object.keys(oldData ?? {}), ...Object.keys(newData ?? {})])].filter(
    (key) => !IGNORED_KEYS.has(key),
  );
  return keys
    .filter((key) => JSON.stringify(oldData?.[key] ?? null) !== JSON.stringify(newData?.[key] ?? null))
    .map((key) => ({ field: key, before: show(key, oldData?.[key]), after: show(key, newData?.[key]) }));
}
