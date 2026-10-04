import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { tabHref } from "@/lib/internal-nav";

/** Reports are a tab of the Documents page; keeps old links working. */
export function GET(request: NextRequest) {
  redirect(tabHref("/internal/documents", "reports", request.nextUrl.searchParams));
}
