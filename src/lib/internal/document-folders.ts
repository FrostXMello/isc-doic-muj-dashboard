import type { DocumentType, DocumentView } from "@/lib/internal/types";

export type DocumentFolder = { type: DocumentType; label: string; description: string };

/** Library folders, one per document type, in display order. */
export const documentFolders: readonly DocumentFolder[] = [
  { type: "agreement", label: "Signed MoUs", description: "Signed agreement copies, by partner country" },
  { type: "newsletter", label: "Newsletters", description: "Synergy, the DoIC newsletter" },
  { type: "policy", label: "Policies", description: "Exchange, credit mapping, and DoIC policies" },
  { type: "form", label: "Forms", description: "Student and visa forms" },
  { type: "brochure", label: "Brochures & flyers", description: "Programme brochures and flyers" },
  { type: "programme-guide", label: "Programme guides", description: "Guides for partner programmes" },
  { type: "report", label: "Reports", description: "Operational reports" },
  { type: "other", label: "Other documents", description: "Process documents and lists" },
];

export const NO_COUNTRY = "No country";

export function findFolder(type: string | undefined) {
  return documentFolders.find((folder) => folder.type === type);
}

/** Country of the first linked university, if any. */
export function documentCountry(doc: Pick<DocumentView, "links">) {
  return doc.links.find((link) => link.country)?.country ?? null;
}

/** Folders that hold at least one document, with their counts. */
export function folderCounts(docs: readonly Pick<DocumentView, "type">[]) {
  return documentFolders
    .map((folder) => ({ ...folder, count: docs.filter((doc) => doc.type === folder.type).length }))
    .filter((folder) => folder.count > 0);
}

/** Country subfolders, alphabetical, with documents lacking a country last. */
export function countryFolders(docs: readonly Pick<DocumentView, "links">[]) {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    const country = documentCountry(doc) ?? NO_COUNTRY;
    counts.set(country, (counts.get(country) ?? 0) + 1);
  }
  return [...counts]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) =>
      a.country === NO_COUNTRY ? 1 : b.country === NO_COUNTRY ? -1 : a.country.localeCompare(b.country),
    );
}

export function inCountry(doc: Pick<DocumentView, "links">, country: string) {
  return (documentCountry(doc) ?? NO_COUNTRY) === country;
}
