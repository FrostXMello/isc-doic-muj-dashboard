"use client";

import { Download, Eye, Lock, Pencil, Plus, Upload, X } from "lucide-react";
import { useId, useRef } from "react";
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
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors",
          size === "sm" ? "h-8 px-2.5 text-[12px]" : "h-9 px-3 text-[13px]",
          variant === "primary"
            ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
            : "border-line bg-transparent text-muted-foreground hover:border-line-bold hover:text-foreground",
        )}
      >
        <Icon className="size-3.5" aria-hidden />
        {label}
        <Lock className="size-3 text-fg-faint" aria-label="Unavailable" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-xl border border-line bg-card p-0 text-foreground shadow-2xl backdrop:bg-scrim backdrop:backdrop-blur-[2px]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent">
              <Lock className="size-4 text-cyan" aria-hidden />
            </div>
            <h2 id={titleId} className="font-display text-[15px] font-medium tracking-[-0.02em]">
              {label} is not available yet
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg p-1 text-fg-subtle hover:bg-overlay hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
          <p>{reason}</p>
          <p className="font-mono text-[10px] tracking-[0.1em] text-fg-faint uppercase">
            Preview · no data was changed
          </p>
        </div>
        <div className="flex justify-end border-t border-line px-5 py-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="h-9 rounded-lg border border-line px-3 text-[13px] text-foreground hover:bg-overlay"
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
  exports:
    "Exports are planned for a later stage and will be generated from the database, so exported figures match the system of record.",
} as const;
