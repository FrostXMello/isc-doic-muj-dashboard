import "server-only";
import { FolderOpen, TriangleAlert } from "lucide-react";
import { EventFiles } from "@/components/internal/event-files";
import { DetailSection } from "@/components/internal/ui/detail";
import { canManage } from "@/components/internal/ui/manage-action";
import { listEventFiles } from "@/lib/internal/data/event-files";

/** An event's folder of files, or the shared templates when `activityCode` is null. Hidden without Supabase. */
export async function EventFilesSection({
  activityCode,
  title,
  description,
  id,
}: {
  activityCode: string | null;
  title: string;
  description: string;
  id?: string;
}) {
  const [{ available, files, failed }, canUpload, canEdit, canDelete] = await Promise.all([
    listEventFiles(activityCode),
    canManage("documents:upload"),
    canManage("activities:update"),
    canManage("activities:delete"),
  ]);
  if (!available) return null;
  return (
    <DetailSection id={id} title={title} description={description} icon={FolderOpen}>
      {failed ? (
        <p role="alert" className="flex items-center gap-2 px-4 pt-1 pb-6 text-[13px] text-danger-fg sm:px-6">
          <TriangleAlert className="size-4" aria-hidden />
          Couldn&apos;t load the files. Refresh to try again.
        </p>
      ) : (
        <EventFiles activityCode={activityCode} files={files} canUpload={canUpload} canEdit={canEdit} canDelete={canDelete} />
      )}
    </DetailSection>
  );
}
