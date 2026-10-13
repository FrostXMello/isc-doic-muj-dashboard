import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { DOCUMENT_BUCKET } from "@/lib/internal/content-forms";
import { resolveInternalDataSource } from "@/lib/internal/data/source";
import { can } from "@/lib/internal/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60;

/**
 * Opens a document's stored file through a short-lived signed link, created
 * with the signed-in user's session so storage RLS decides access.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in") {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }
  if (!can(auth.roles, "documents:read") || resolveInternalDataSource() !== "supabase") {
    return new NextResponse("Not found", { status: 404 });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_bucket, storage_path")
    .eq("code", id)
    .maybeSingle();
  if (!doc?.storage_path || doc.storage_bucket !== DOCUMENT_BUCKET) {
    return new NextResponse("Not found", { status: 404 });
  }
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_SECONDS, { download: false });
  if (error || !data?.signedUrl) return new NextResponse("Not found", { status: 404 });

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
