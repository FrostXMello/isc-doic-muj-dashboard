import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { buildExport, exportDatasets, type ExportDataset } from "@/lib/internal/csv";
import { openDataContext } from "@/lib/internal/data/context";
import { can } from "@/lib/internal/permissions";

/** CSV download of one dataset, read as the signed-in user (RLS applies). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ dataset: string }> }) {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in") {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }
  const { dataset } = await params;
  if (!can(auth.roles, "reports:export") || !(exportDatasets as readonly string[]).includes(dataset)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const { data, today } = await openDataContext();
  return new NextResponse(buildExport(dataset as ExportDataset, data), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="doic-${dataset}-${today}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
