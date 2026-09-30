import { matchesQuery, openDataContext } from "@/lib/internal/data/context";
import type { DocumentLinkView, DocumentStatus, DocumentType } from "@/lib/internal/types";

export const documentTypes: readonly DocumentType[] = [
  "agreement",
  "brochure",
  "programme-guide",
  "policy",
  "report",
  "other",
];

export const documentStatuses: readonly DocumentStatus[] = [
  "draft",
  "under-review",
  "final",
  "archived",
];

export type DocumentLinkFilter = DocumentLinkView["kind"] | "unlinked";

export const documentLinkFilters: readonly DocumentLinkFilter[] = [
  "institution",
  "agreement",
  "program",
  "availability",
  "unlinked",
];

export type DocumentFilters = {
  q?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  linked?: DocumentLinkFilter;
};

export async function listDocuments(filters: DocumentFilters = {}) {
  const { data, views } = await openDataContext();
  return data.documents
    .map(views.toDocumentView)
    .filter(
      (row) =>
        matchesQuery(filters.q, row.title, row.description, ...row.links.map((l) => l.label)) &&
        (!filters.type || row.type === filters.type) &&
        (!filters.status || row.status === filters.status) &&
        (!filters.linked ||
          (filters.linked === "unlinked"
            ? row.links.length === 0
            : row.links.some((link) => link.kind === filters.linked))),
    )
    .sort((a, b) => (b.updatedOn ?? "").localeCompare(a.updatedOn ?? ""));
}

export async function getDocument(id: string) {
  const { data, views } = await openDataContext();
  const document = data.documents.find((row) => row.id === id);
  return document ? views.toDocumentView(document) : null;
}
