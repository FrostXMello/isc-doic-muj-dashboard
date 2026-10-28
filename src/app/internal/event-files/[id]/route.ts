import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { resolveInternalDataSource } from "@/lib/internal/data/source";
import { EVENT_FILES_BUCKET, isBlobPath } from "@/lib/internal/event-files";
import { can } from "@/lib/internal/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60;

/** Kinds browsers show in a tab; everything else downloads under its real name. */
const VIEWABLE = /^(application\/pdf|image\/(png|jpe?g|gif|webp)|video\/mp4|text\/plain)$/;

/**
 * Opens or downloads a flagship event file through a short-lived signed link,
 * created with the signed-in user's session so storage RLS decides access.
 * `?download=1` always downloads.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAuthContext();
  if (auth.state !== "signed-in") {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }
  if (!can(auth.roles, "activities:read") || resolveInternalDataSource() !== "supabase") {
    return new NextResponse("Not found", { status: 404 });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const { data: file } = await supabase
    .from("activity_files")
    .select("name, storage_path, mime_type")
    .eq("id", id)
    .maybeSingle();
  if (!file || !isBlobPath(file.storage_path)) return new NextResponse("Not found", { status: 404 });

  const inline = request.nextUrl.searchParams.get("download") !== "1" && VIEWABLE.test(file.mime_type ?? "");
  const { data, error } = await supabase.storage
    .from(EVENT_FILES_BUCKET)
    .createSignedUrl(file.storage_path, SIGNED_URL_SECONDS, { download: inline ? false : file.name });
  if (error || !data?.signedUrl) return new NextResponse("Not found", { status: 404 });

  const response = NextResponse.redirect(data.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
