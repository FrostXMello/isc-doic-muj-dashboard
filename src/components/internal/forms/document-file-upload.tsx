"use client";

import { CheckCircle2, LoaderCircle, TriangleAlert, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { attachDocumentFile } from "@/lib/internal/content-actions";
import {
  allowedDocumentTypes,
  checkDocumentFile,
  DOCUMENT_BUCKET,
  documentObjectPath,
} from "@/lib/internal/content-forms";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Uploads a document's file straight to the private bucket as the signed-in
 * user (storage RLS checks the role and the path), then asks the server to
 * record it. Files never pass through the app server, so the 25 MB bucket
 * limit applies rather than the hosting platform's request-size limit.
 */
export function DocumentFileUpload({
  documentId,
  code,
  hasFile,
}: {
  documentId: string;
  code: string;
  hasFile: boolean;
}) {
  const router = useRouter();
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ tone: "error" | "done"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function upload() {
    if (!file) return;
    const problem = checkDocumentFile(file);
    if (problem) {
      setStatus({ tone: "error", text: problem });
      return;
    }
    setStatus(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setStatus({ tone: "error", text: "Uploads aren't available: Supabase isn't configured." });
        return;
      }
      const path = documentObjectPath(documentId, file.name);
      const { error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        setStatus({ tone: "error", text: "The upload was refused. Check your role and the file, then try again." });
        return;
      }
      const form = new FormData();
      form.set("existing", code);
      form.set("path", path);
      form.set("mime", file.type);
      form.set("size", String(file.size));
      const result = await attachDocumentFile({}, form);
      if (result.error) {
        setStatus({ tone: "error", text: result.error });
        return;
      }
      setFile(null);
      setStatus({ tone: "done", text: hasFile ? "File replaced. The earlier version is kept in storage." : "File uploaded." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 px-6 pt-1 pb-6">
      <label htmlFor={`${id}-file`} className="block text-[12px] font-medium text-fg-soft">
        {hasFile ? "Replace the file" : "Upload the file"}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={`${id}-file`}
          type="file"
          accept={allowedDocumentTypes.join(",")}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          aria-describedby={`${id}-hint`}
          className="max-w-full text-[13px] text-fg-soft file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-transparent file:px-3 file:py-1.5 file:text-[12px] file:text-foreground"
        />
        <button type="button" onClick={upload} disabled={!file || pending} className={buttonClass("primary", "sm")}>
          {pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Upload className="size-3.5" aria-hidden />}
          Upload
        </button>
      </div>
      <p id={`${id}-hint`} className="text-[12px] text-fg-faint">
        PDF, Word, Excel, PowerPoint, text, CSV, PNG, or JPEG; up to 25 MB. Stored privately; only signed-in staff can open it.
      </p>
      {status ? (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={status.tone === "error" ? "flex items-center gap-2 text-[13px] text-danger-fg" : "flex items-center gap-2 text-[13px] text-success-fg"}
        >
          {status.tone === "error" ? <TriangleAlert className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
