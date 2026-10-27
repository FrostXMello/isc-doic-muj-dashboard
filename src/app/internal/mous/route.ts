import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/** MoUs are listed under their universities; keeps old links and filters working. */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = new URLSearchParams();
  const mapping = { q: "q", country: "country", status: "mouStatus", type: "mouType", qs: "qs", sort: "sort" } as const;
  for (const [from, to] of Object.entries(mapping)) {
    const value = params.get(from)?.trim();
    if (value) next.set(to, value);
  }
  redirect(`/internal/universities?${next.toString()}`);
}
