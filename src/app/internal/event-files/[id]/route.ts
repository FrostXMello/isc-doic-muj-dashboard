import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { resolveInternalDataSource } from "@/lib/internal/data/source";
import { EVENT_FILES_BUCKET, isBlobPath } from "@/lib/internal/event-files";
import { can } from "@/lib/internal/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SIGNED_URL_SECONDS = 60;

/** The Office web viewer fetches the file itself, sometimes after a delay. */
const OFFICE_URL_SECONDS = 600;

/** Kinds browsers show in a tab. */
const VIEWABLE = /^(application\/pdf|image\/(png|jpe?g|gif|webp|svg\+xml)|video\/mp4|text\/(plain|csv))$/;

/** Office files open in Microsoft's web viewer, within its size limits (10 MB; 5 MB for workbooks). */
function officeViewable(name: string, size: number) {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["doc", "docx", "ppt", "pptx"].includes(ext)) return size <= 10 * 1024 * 1024;
  if (["xls", "xlsx"].includes(ext)) return size <= 5 * 1024 * 1024;
  return false;
}

/**
 * Opens or downloads a flagship event file through a short-lived signed link,
 * created with the signed-in user's session so storage RLS decides access.
 * PDFs, images, and video open in the browser; Word, Excel, and PowerPoint
 * open in the Office web viewer; anything else downloads under its real name.
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
    .select("name, storage_path, mime_type, size_bytes")
    .eq("id", id)
    .maybeSingle();
  if (!file || !isBlobPath(file.storage_path)) return new NextResponse("Not found", { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const office = !download && officeViewable(file.name, Number(file.size_bytes));
  const inline = !download && VIEWABLE.test(file.mime_type ?? "");
  const { data, error } = await supabase.storage
    .from(EVENT_FILES_BUCKET)
    .createSignedUrl(file.storage_path, office ? OFFICE_URL_SECONDS : SIGNED_URL_SECONDS, {
      download: inline || office ? false : file.name,
    });
  if (error || !data?.signedUrl) return new NextResponse("Not found", { status: 404 });

  const response = NextResponse.redirect(
    office ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(data.signedUrl)}` : data.signedUrl,
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
