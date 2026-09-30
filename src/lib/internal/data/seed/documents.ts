import type { DocumentLink, DocumentRecord } from "@/lib/internal/types";

/**
 * SAMPLE DATA — fictional document metadata.
 *
 * No file exists behind any row: `storageKey` is always null because file
 * storage is not connected. Titles are generic and attach only to fictional
 * sample records or to the public programme categories.
 */
export const documentSeed: readonly DocumentRecord[] = [
  {
    id: "doc-001",
    title: "Framework memorandum — signed copy (sample)",
    type: "agreement",
    status: "final",
    updatedOn: "2021-12-01",
    storageKey: null,
    description: "Placeholder for the signed copy of SAMPLE-AGR-001.",
    source: "sample",
  },
  {
    id: "doc-002",
    title: "Framework memorandum — renewal draft (sample)",
    type: "agreement",
    status: "draft",
    updatedOn: "2026-09-12",
    storageKey: null,
    description: "Placeholder for a renewal draft ahead of the SAMPLE-AGR-001 end date.",
    source: "sample",
  },
  {
    id: "doc-003",
    title: "Research collaboration agreement (sample)",
    type: "agreement",
    status: "final",
    updatedOn: "2024-03-01",
    storageKey: null,
    description: null,
    source: "sample",
  },
  {
    id: "doc-004",
    title: "Renewed exchange agreement — working draft (sample)",
    type: "agreement",
    status: "under-review",
    updatedOn: "2026-08-28",
    storageKey: null,
    description: null,
    source: "sample",
  },
  {
    id: "doc-005",
    title: "Semester exchange student guide (sample)",
    type: "programme-guide",
    status: "final",
    updatedOn: "2026-07-15",
    storageKey: null,
    description: "Placeholder guide attached to the Semester Exchange programme.",
    source: "sample",
  },
  {
    id: "doc-006",
    title: "Academic visits brochure (sample)",
    type: "brochure",
    status: "under-review",
    updatedOn: "2026-09-05",
    storageKey: null,
    description: null,
    source: "sample",
  },
  {
    id: "doc-007",
    title: "Outbound mobility policy (sample)",
    type: "policy",
    status: "draft",
    updatedOn: "2026-06-30",
    storageKey: null,
    description: "Placeholder policy document with no institution link.",
    source: "sample",
  },
  {
    id: "doc-008",
    title: "Annual collaboration summary (sample)",
    type: "report",
    status: "archived",
    updatedOn: "2025-06-30",
    storageKey: null,
    description: null,
    source: "sample",
  },
  {
    id: "doc-009",
    title: "Dual degree proposal — review notes (sample)",
    type: "other",
    status: "under-review",
    updatedOn: "2026-09-18",
    storageKey: null,
    description: null,
    source: "sample",
  },
];

export const documentLinkSeed: readonly DocumentLink[] = [
  { id: "dl-001", documentId: "doc-001", institutionId: null, agreementId: "agr-001", programId: null, availabilityId: null },
  { id: "dl-002", documentId: "doc-001", institutionId: "smp-harbour", agreementId: null, programId: null, availabilityId: null },
  { id: "dl-003", documentId: "doc-002", institutionId: null, agreementId: "agr-001", programId: null, availabilityId: null },
  { id: "dl-004", documentId: "doc-003", institutionId: null, agreementId: "agr-003", programId: null, availabilityId: null },
  { id: "dl-005", documentId: "doc-004", institutionId: null, agreementId: "agr-006", programId: null, availabilityId: null },
  { id: "dl-006", documentId: "doc-005", institutionId: null, agreementId: null, programId: "semester-exchange", availabilityId: null },
  { id: "dl-007", documentId: "doc-005", institutionId: null, agreementId: null, programId: null, availabilityId: "off-001" },
  { id: "dl-008", documentId: "doc-006", institutionId: null, agreementId: null, programId: "academic-visits", availabilityId: null },
  { id: "dl-009", documentId: "doc-009", institutionId: null, agreementId: "agr-007", programId: null, availabilityId: null },
  { id: "dl-010", documentId: "doc-009", institutionId: "smp-lakes", agreementId: null, programId: null, availabilityId: null },
];
