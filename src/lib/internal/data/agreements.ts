import { openDataContext } from "@/lib/internal/data/context";
import { agreementTypeOptions } from "@/lib/internal/record-forms";
import type { AgreementStatus, AgreementType } from "@/lib/internal/types";

export const agreementStatuses: readonly AgreementStatus[] = [
  "active",
  "expiring-soon",
  "pending-start",
  "under-review",
  "draft",
  "expired",
  "terminated",
  "not-stated",
];

export const agreementTypes: readonly AgreementType[] = agreementTypeOptions;

/** The stored agreement row, for redirects and edit forms. */
export async function findAgreementRecord(id: string) {
  const { data } = await openDataContext();
  return data.agreements.find((row) => row.id === id) ?? null;
}
