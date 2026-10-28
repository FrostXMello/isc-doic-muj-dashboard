"use client";

import {
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Folder,
  FolderUp,
  LoaderCircle,
  Pencil,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, useTransition } from "react";
import { buttonClass, inputBaseClass } from "@/components/internal/ui/button-styles";
import {
  deleteEventFile,
  deleteEventFolder,
  type EventFileResult,
  recordEventFiles,
  renameEventFolder,
  updateEventFile,
} from "@/lib/internal/event-file-actions";
import {
  blobPath,
  buildFolderTree,
  type EventFile,
  type EventFileInput,
  EVENT_FILES_BUCKET,
  folderFromRelativePath,
  folderPaths,
  type FolderNode,
  formatBytes,
  isClutter,
  MAX_EVENT_FILE_BYTES,
} from "@/lib/internal/event-files";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Status = { tone: "error" | "done" | "busy"; text: string } | null;

type Permissions = { canUpload: boolean; canEdit: boolean; canDelete: boolean };

const NEW_FOLDER = "\u0000new";
const RECORD_BATCH = 100;

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function alreadyStored(error: { message?: string; statusCode?: string; status?: number }) {
  return error.statusCode === "409" || error.status === 409 || /exist|duplicate/i.test(error.message ?? "");
}

function fileHref(file: EventFile, download = false) {
  return `/internal/event-files/${file.id}${download ? "?download=1" : ""}`;
}

/**
 * A flagship event's folder of files (or the shared templates when
 * `activityCode` is null). Files upload straight from the browser to the
 * private bucket, stored once per content hash so copies cost nothing, and
 * the server records where each one sits in the folder tree.
 */
export function EventFiles({
  activityCode,
  files,
  canUpload,
  canEdit,
  canDelete,
}: { activityCode: string | null; files: EventFile[] } & Permissions) {
  const router = useRouter();
  const id = useId();
  const filesInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState("");
  const [newFolder, setNewFolder] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [pending, startTransition] = useTransition();
  const tree = useMemo(() => buildFolderTree(files), [files]);
  const paths = useMemo(() => folderPaths(tree), [tree]);

  const targetFolder = target === NEW_FOLDER ? newFolder : target;

  function report(result: EventFileResult) {
    if (result.error) setStatus({ tone: "error", text: result.error });
    else if (result.message) setStatus({ tone: "done", text: result.message });
    router.refresh();
  }

  function upload(list: FileList | null, asFolder: boolean) {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    const skipped: string[] = [];
    const queue: { file: File; folder: string }[] = [];
    for (const file of picked) {
      if (isClutter(file.name)) continue;
      if (file.size > MAX_EVENT_FILE_BYTES) {
        skipped.push(file.name);
        continue;
      }
      const folder = asFolder
        ? folderFromRelativePath(file.webkitRelativePath || file.name, targetFolder)
        : folderFromRelativePath(file.name, targetFolder);
      if (folder === null) {
        skipped.push(file.name);
        continue;
      }
      queue.push({ file, folder });
    }
    if (queue.length === 0) {
      setStatus({ tone: "error", text: skipped.length ? `Nothing uploaded: ${skipped.length} file(s) are over 50 MB or have unusable names.` : "Nothing to upload." });
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setStatus({ tone: "error", text: "Uploads aren't available: Supabase isn't configured." });
        return;
      }
      const done: EventFileInput[] = [];
      const failed: string[] = [];
      for (const [index, { file, folder }] of queue.entries()) {
        setStatus({ tone: "busy", text: `Uploading ${index + 1} of ${queue.length}: ${file.name}` });
        try {
          const sha = await sha256(file);
          const { error } = await supabase.storage
            .from(EVENT_FILES_BUCKET)
            .upload(blobPath(sha), file, { contentType: file.type || "application/octet-stream", upsert: false });
          if (error && !alreadyStored(error as never)) {
            failed.push(file.name);
            continue;
          }
          done.push({ folder, name: file.name, sha, size: file.size, mime: file.type || "application/octet-stream" });
        } catch {
          failed.push(file.name);
        }
      }

      let recorded = 0;
      for (let i = 0; i < done.length; i += RECORD_BATCH) {
        const result = await recordEventFiles(activityCode, done.slice(i, i + RECORD_BATCH));
        if (result.error) {
          setStatus({ tone: "error", text: `${recorded} added, then: ${result.error}` });
          router.refresh();
          return;
        }
        recorded += Math.min(RECORD_BATCH, done.length - i);
      }
      const notes = [
        `${recorded} ${recorded === 1 ? "file" : "files"} added.`,
        skipped.length ? `${skipped.length} skipped (over 50 MB or unusable name): ${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}.` : "",
        failed.length ? `${failed.length} failed to upload: ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "…" : ""}.` : "",
      ].filter(Boolean);
      setStatus({ tone: failed.length || skipped.length ? "error" : "done", text: notes.join(" ") });
      if (target === NEW_FOLDER) {
        setTarget("");
        setNewFolder("");
      }
      router.refresh();
    });
  }

  const actions = {
    pending,
    paths,
    canEdit,
    canDelete,
    run(task: () => Promise<EventFileResult>) {
      startTransition(async () => report(await task()));
    },
    renameFolder(folder: FolderNode) {
      const next = window.prompt("Rename or move this folder. Use “/” for subfolders.", folder.path);
      if (next === null || next.trim() === folder.path) return;
      this.run(() => renameEventFolder(activityCode, folder.path, next));
    },
    deleteFolder(folder: FolderNode) {
      if (!window.confirm(`Delete “${folder.path}” and all ${folder.count} files in it? This can't be undone.`)) return;
      this.run(() => deleteEventFolder(activityCode, folder.path));
    },
    deleteFile(file: EventFile) {
      if (!window.confirm(`Delete “${file.name}”? This can't be undone.`)) return;
      this.run(() => deleteEventFile(file.id));
    },
  };

  return (
    <div className="space-y-4 px-4 pt-1 pb-6 sm:px-6">
      {canUpload ? (
        <div className="space-y-3 rounded-xl border border-line bg-overlay p-3 sm:p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-[12px] font-medium text-fg-soft" htmlFor={`${id}-target`}>
              Upload into
              <select
                id={`${id}-target`}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                className={`${inputBaseClass} h-9`}
                disabled={pending}
              >
                <option value="">Top level</option>
                {paths.map((path) => (
                  <option key={path} value={path}>
                    {path.replaceAll("/", " / ")}
                  </option>
                ))}
                <option value={NEW_FOLDER}>New folder…</option>
              </select>
            </label>
            {target === NEW_FOLDER ? (
              <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-[12px] font-medium text-fg-soft" htmlFor={`${id}-new`}>
                Folder name
                <input
                  id={`${id}-new`}
                  value={newFolder}
                  onChange={(event) => setNewFolder(event.target.value)}
                  placeholder="e.g. Certificates or Photos/Day 1"
                  className={`${inputBaseClass} h-9`}
                  disabled={pending}
                />
              </label>
            ) : null}
            <div className="flex w-full gap-2 sm:w-auto max-sm:[&>*]:flex-1">
              <button type="button" className={buttonClass("primary", "sm")} disabled={pending} onClick={() => filesInput.current?.click()}>
                <Upload className="size-3.5" aria-hidden />
                Upload files
              </button>
              <button type="button" className={buttonClass("secondary", "sm")} disabled={pending} onClick={() => folderInput.current?.click()}>
                <FolderUp className="size-3.5" aria-hidden />
                Upload folder
              </button>
            </div>
          </div>
          <input
            ref={filesInput}
            type="file"
            multiple
            hidden
            onChange={(event) => {
              upload(event.target.files, false);
              event.target.value = "";
            }}
          />
          <input
            ref={folderInput}
            type="file"
            multiple
            hidden
            {...{ webkitdirectory: "", directory: "" }}
            onChange={(event) => {
              upload(event.target.files, true);
              event.target.value = "";
            }}
          />
          <p className="text-[12px] text-fg-faint">
            Any file type, up to 50 MB each. “Upload folder” keeps the folder and its subfolders. Stored privately; only signed-in staff can open them.
          </p>
        </div>
      ) : null}

      {status ? (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={`flex items-start gap-2 text-[13px] ${status.tone === "error" ? "text-danger-fg" : status.tone === "done" ? "text-success-fg" : "text-fg-soft"}`}
        >
          {status.tone === "busy" ? (
            <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden />
          ) : status.tone === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span className="min-w-0 break-words">{status.text}</span>
        </p>
      ) : null}

      {tree.count === 0 ? (
        <p className="text-[13px] text-fg-faint">No files yet.</p>
      ) : (
        <div className="rounded-xl border border-line">
          <p className="border-b border-line px-3 py-2 text-[12px] text-fg-faint">
            {tree.count} {tree.count === 1 ? "file" : "files"} · {formatBytes(tree.bytes)}
          </p>
          <FolderContents node={tree} depth={0} actions={actions} />
        </div>
      )}
    </div>
  );
}

type Actions = {
  pending: boolean;
  paths: string[];
  canEdit: boolean;
  canDelete: boolean;
  run: (task: () => Promise<EventFileResult>) => void;
  renameFolder: (folder: FolderNode) => void;
  deleteFolder: (folder: FolderNode) => void;
  deleteFile: (file: EventFile) => void;
};

const iconButton =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-overlay hover:text-foreground disabled:opacity-50 pointer-coarse:size-10";

function FolderContents({ node, depth, actions }: { node: FolderNode; depth: number; actions: Actions }) {
  return (
    <ul className={depth === 0 ? "divide-y divide-line" : "border-l border-line ml-4 sm:ml-5"}>
      {node.folders.map((folder) => (
        <li key={folder.path}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 hover:bg-overlay [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-4 shrink-0 text-fg-faint transition-transform group-open:rotate-90" aria-hidden />
              <Folder className="size-4 shrink-0 text-muj" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{folder.name}</span>
              <span className="shrink-0 text-[12px] text-fg-faint tabular-nums">
                {folder.count} · {formatBytes(folder.bytes)}
              </span>
              {actions.canEdit ? (
                <button
                  type="button"
                  className={iconButton}
                  disabled={actions.pending}
                  aria-label={`Rename or move folder ${folder.name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    actions.renameFolder(folder);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              ) : null}
              {actions.canDelete ? (
                <button
                  type="button"
                  className={iconButton}
                  disabled={actions.pending}
                  aria-label={`Delete folder ${folder.name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    actions.deleteFolder(folder);
                  }}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </summary>
            <FolderContents node={folder} depth={depth + 1} actions={actions} />
          </details>
        </li>
      ))}
      {node.files.map((file) => (
        <FileRow key={file.id} file={file} actions={actions} />
      ))}
    </ul>
  );
}

function FileRow({ file, actions }: { file: EventFile; actions: Actions }) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(file.name);
  const [folder, setFolder] = useState(file.folder);

  if (editing) {
    return (
      <li className="px-3 py-3">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            actions.run(() => updateEventFile(file.id, name, folder));
            setEditing(false);
          }}
        >
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-[12px] text-fg-soft" htmlFor={`${id}-name`}>
            Name
            <input id={`${id}-name`} value={name} onChange={(event) => setName(event.target.value)} className={`${inputBaseClass} h-9`} required />
          </label>
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-[12px] text-fg-soft" htmlFor={`${id}-folder`}>
            Folder
            <input
              id={`${id}-folder`}
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              list={`${id}-folders`}
              placeholder="Top level"
              className={`${inputBaseClass} h-9`}
            />
            <datalist id={`${id}-folders`}>
              {actions.paths.map((path) => (
                <option key={path} value={path} />
              ))}
            </datalist>
          </label>
          <div className="flex w-full gap-2 sm:w-auto max-sm:[&>*]:flex-1">
            <button type="submit" className={buttonClass("primary", "sm")} disabled={actions.pending}>
              Save
            </button>
            <button
              type="button"
              className={buttonClass("secondary", "sm")}
              onClick={() => {
                setName(file.name);
                setFolder(file.folder);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 px-3 py-1.5 hover:bg-overlay">
      <FileText className="ml-6 size-4 shrink-0 text-fg-faint" aria-hidden />
      <a
        href={fileHref(file)}
        target="_blank"
        rel="noopener"
        className="min-w-0 flex-1 py-1 text-[13px] text-foreground hover:text-muj hover:underline line-clamp-2 sm:truncate"
        title={file.name}
      >
        {file.name}
      </a>
      <span className="hidden shrink-0 text-[12px] text-fg-faint tabular-nums sm:inline">{formatBytes(file.sizeBytes)}</span>
      <a href={fileHref(file, true)} className={iconButton} aria-label={`Download ${file.name}`} title="Download">
        <Download className="size-3.5" aria-hidden />
      </a>
      {actions.canEdit ? (
        <button type="button" className={iconButton} disabled={actions.pending} aria-label={`Rename or move ${file.name}`} onClick={() => setEditing(true)}>
          <Pencil className="size-3.5" aria-hidden />
        </button>
      ) : null}
      {actions.canDelete ? (
        <button type="button" className={iconButton} disabled={actions.pending} aria-label={`Delete ${file.name}`} onClick={() => actions.deleteFile(file)}>
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </li>
  );
}
