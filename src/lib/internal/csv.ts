import type { Dataset } from "@/lib/internal/data/dataset";

type Cell = string | number | boolean | null | undefined;

/**
 * One CSV cell. Values that a spreadsheet would run as a formula (leading
 * =, +, -, @, tab, or carriage return) are prefixed with an apostrophe.
 */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: readonly string[], rows: readonly (readonly Cell[])[]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export const exportDatasets = ["universities", "agreements", "offerings", "calls", "activities", "documents"] as const;
export type ExportDataset = (typeof exportDatasets)[number];

/** Download URL of a dataset (a route handler, so a plain link rather than client navigation). */
export const exportHref = (dataset: ExportDataset) => `/internal/export/${dataset}`;

export const exportLabels: Record<ExportDataset, string> = {
  universities: "Universities",
  agreements: "MoUs and agreements",
  offerings: "Programme offerings",
  calls: "Calls (opportunities)",
  activities: "Activities",
  documents: "Documents and reports",
};

/** The records a signed-in reader can already see, as CSV. Contacts are never exported. */
export function buildExport(dataset: ExportDataset, data: Dataset): string {
  const institution = new Map(data.institutions.map((row) => [row.id, row.name]));
  const program = new Map(data.programs.map((row) => [row.id, row.name]));
  switch (dataset) {
    case "universities":
      return toCsv(
        ["Code", "Name", "Country", "City", "Website", "Public", "Verification", "Source"],
        data.institutions.map((row) => [row.id, row.name, row.country, row.city, row.website, row.isPublic, row.verification, row.source]),
      );
    case "agreements":
      return toCsv(
        ["Code", "Reference", "Title", "Lead university", "Type", "Status", "Start", "End", "Renewal", "Verification"],
        data.agreements.map((row) => [
          row.id,
          row.reference,
          row.title,
          institution.get(row.institutionId) ?? row.institutionId,
          row.type,
          row.recordStatus,
          row.startDate,
          row.endDate,
          row.renewal,
          row.verification,
        ]),
      );
    case "offerings":
      return toCsv(
        ["Code", "Programme", "University", "Agreement", "Availability", "Applications open", "Applications close", "Verification"],
        data.availability.map((row) => [
          row.id,
          program.get(row.programId) ?? row.programId,
          institution.get(row.institutionId) ?? row.institutionId,
          row.agreementId,
          row.availability,
          row.applicationStart,
          row.applicationEnd,
          row.verification,
        ]),
      );
    case "calls":
      return toCsv(
        ["Code", "Title", "Programme", "University", "Offering", "Opens", "Deadline", "Status", "Verification"],
        data.opportunities.map((row) => [
          row.id,
          row.title,
          program.get(row.programId) ?? row.programId,
          row.institutionId ? (institution.get(row.institutionId) ?? row.institutionId) : null,
          row.availabilityId,
          row.opensOn,
          row.deadline,
          row.recordStatus,
          row.verification,
        ]),
      );
    case "activities":
      return toCsv(
        ["Code", "Title", "Type", "Status", "Start", "End", "Country", "City", "University", "Agreement", "Participants", "Summary"],
        data.activities.map((row) => [
          row.id,
          row.title,
          row.type,
          row.recordStatus,
          row.startDate,
          row.endDate,
          row.country,
          row.city,
          row.institutionId ? (institution.get(row.institutionId) ?? row.institutionId) : null,
          row.agreementId,
          row.participants,
          row.summary,
        ]),
      );
    case "documents":
      return toCsv(
        ["Code", "Title", "Category", "Status", "Revised", "Official link", "File stored", "Verification"],
        data.documents.map((row) => [
          row.id,
          row.title,
          row.type,
          row.status,
          row.updatedOn,
          row.url,
          Boolean(row.storageKey),
          row.verification,
        ]),
      );
  }
}
