/**
 * Flagship event files (supabase/migrations/20261028120000_activity_files.sql):
 * each event's folder of working documents, plus shared files and templates.
 * Pure helpers shared by the browser uploader and the server actions.
 */

export const EVENT_FILES_BUCKET = "event-files";
/** The bucket's limit, which is also the Supabase free plan's largest file. */
export const MAX_EVENT_FILE_BYTES = 50 * 1024 * 1024;

export type EventFile = {
  id: string;
  folder: string;
  name: string;
  sizeBytes: number;
  mimeType: string | null;
  updatedAt: string;
};

export type EventFileInput = { folder: string; name: string; sha: string; size: number; mime: string };

const SHA256 = /^[0-9a-f]{64}$/;

export function blobPath(sha: string) {
  return `blobs/${sha}`;
}

export function isBlobPath(path: string) {
  return /^blobs\/[0-9a-f]{64}$/.test(path);
}

export function isSha256(value: string) {
  return SHA256.test(value);
}

/** A file or folder name as people typed it, trimmed; null when unusable. */
export function cleanName(value: string): string | null {
  const name = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!name || name === "." || name === ".." || /[/\\]/.test(name) || name.length > 255) return null;
  return name;
}

/** "A / B/ C" → "A/B/C"; "" for the top level; null when a part is unusable. */
export function cleanFolder(value: string): string | null {
  const parts = value
    .split(/[/\\]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  const cleaned = parts.map(cleanName);
  if (cleaned.some((part) => part === null)) return null;
  const folder = cleaned.join("/");
  return folder.length <= 400 ? folder : null;
}

/** Folder of a file picked with "Upload folder", relative to the chosen target. */
export function folderFromRelativePath(relativePath: string, target: string): string | null {
  const parts = relativePath.split("/").slice(0, -1);
  return cleanFolder([target, ...parts].filter(Boolean).join("/"));
}

/** Files the uploader skips: system clutter and Office lock files. */
export function isClutter(name: string) {
  return /^(\.DS_Store|Thumbs\.db|desktop\.ini|~\$.*|\._.*)$/i.test(name);
}

/** Next free name in a folder: "Report.pdf" → "Report (2).pdf". */
export function uniqueName(name: string, taken: ReadonlySet<string>) {
  if (!taken.has(name.toLowerCase())) return name;
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  for (let n = 2; ; n += 1) {
    const candidate = `${stem} (${n})${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export type FolderNode = {
  name: string;
  path: string;
  folders: FolderNode[];
  files: EventFile[];
  /** Files in this folder and every folder below it. */
  count: number;
  bytes: number;
};

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** Files grouped into their folder tree, folders and files in natural order. */
export function buildFolderTree(files: readonly EventFile[]): FolderNode {
  const root: FolderNode = { name: "", path: "", folders: [], files: [], count: 0, bytes: 0 };
  for (const file of files) {
    let node = root;
    node.count += 1;
    node.bytes += file.sizeBytes;
    for (const part of file.folder ? file.folder.split("/") : []) {
      const path = node.path ? `${node.path}/${part}` : part;
      let child = node.folders.find((folder) => folder.name === part);
      if (!child) {
        child = { name: part, path, folders: [], files: [], count: 0, bytes: 0 };
        node.folders.push(child);
      }
      node = child;
      node.count += 1;
      node.bytes += file.sizeBytes;
    }
    node.files.push(file);
  }
  const sort = (node: FolderNode) => {
    node.folders.sort((a, b) => collator.compare(a.name, b.name));
    node.files.sort((a, b) => collator.compare(a.name, b.name));
    node.folders.forEach(sort);
  };
  sort(root);
  return root;
}

/** Every folder path in the tree, for "move to" and "upload into" pickers. */
export function folderPaths(node: FolderNode): string[] {
  return node.folders.flatMap((folder) => [folder.path, ...folderPaths(folder)]);
}
