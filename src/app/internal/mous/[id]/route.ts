import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { requirePortalAccess } from "@/lib/auth/session";
import { findAgreementRecord } from "@/lib/internal/data/agreements";
import { agreementHref } from "@/lib/internal/links";

/** An agreement now opens on its lead university's page. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePortalAccess("internal", `/internal/mous/${id}`);
  const agreement = await findAgreementRecord(id);
  if (!agreement) notFound();
  redirect(agreementHref(agreement));
}
