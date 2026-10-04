import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { tabHref } from "@/lib/internal-nav";

/** Opportunities are a tab of the Programs page; keeps old links and their filters working. */
export function GET(request: NextRequest) {
  redirect(tabHref("/internal/programs", "opportunities", request.nextUrl.searchParams));
}
