"use client";

import { Download, Eye, Lock, Pencil, Plus, Upload, X } from "lucide-react";
import { useId, useRef } from "react";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { cn } from "@/lib/utils";

const icons = {
  upload: Upload,
  view: Eye,
  download: Download,
  edit: Pencil,
  add: Plus,
} as const;

export type PlaceholderIcon = keyof typeof icons;

/**
 * A visible action that is not available yet.
 *
 * It opens a dialog explaining why (no editing workflow or file storage yet),
 * instead of silently doing nothing. Replace with a real action once the
 * workflow exists.
 */
export function PlaceholderAction({
  label,
  icon,
  reason,
  variant = "secondary",
  size = "md",
}: {
  label: string;
  icon: PlaceholderIcon;
  reason: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const Icon = icons[icon];

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-haspopup="dialog"
        title={`${label} — not available yet`}
        className={buttonClass(variant, size)}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
        <Lock className={cn("size-3", variant === "primary" ? "opacity-60" : "text-fg-faint")} aria-label="Unavailable" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-[1.5rem] border border-line bg-popover p-0 text-foreground shadow-[0_40px_80px_-30px_rgba(0,0,0,0.5)] backdrop:bg-scrim backdrop:backdrop-blur-[3px]"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-muj/[0.12]">
              <Lock className="size-4 text-muj-fg" aria-hidden />
            </div>
            <h2 id={titleId} className="font-display text-[17px] font-medium tracking-[-0.025em]">
              {label} is not available yet
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-full p-1.5 text-fg-subtle transition-colors hover:bg-overlay hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-6 py-3 text-[13px] leading-relaxed text-muted-foreground">
          <p>{reason}</p>
          <p className="text-[11px] font-medium tracking-[0.16em] text-fg-faint uppercase">
            Preview · no data was changed
          </p>
        </div>
        <div className="flex justify-end px-6 pt-2 pb-6">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={buttonClass("secondary")}
          >
            Understood
          </button>
        </div>
      </dialog>
    </>
  );
}

export const unavailableReasons = {
  storage:
    "File uploads to secure storage are planned for a later stage. Metadata is shown for planning; no file exists behind this record.",
  editing:
    "Creating and editing records in the portal is planned for a later stage. Records here are read-only.",
  staticSource:
    "This deployment reads the bundled official dataset, which is read-only. Editing universities and MoUs needs the Supabase data source (INTERNAL_DATA_SOURCE=supabase).",
  exports:
    "Exports are planned for a later stage and will be generated from the database, so exported figures match the system of record.",
} as const;
