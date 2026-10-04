"use client";

import { LoaderCircle, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FilterSelectControl, type FilterSelect } from "@/components/internal/ui/filter-bar";

/**
 * Dashboard-wide filters backed by URL params, so a filtered view can be
 * shared and survives a reload. Each select states what it narrows.
 */
export function DashboardFilters({
  selects,
  values,
}: {
  selects: readonly (FilterSelect & { scope: string })[];
  /** Filters the server applied; unknown URL values are dropped there and not shown as active. */
  values: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function navigate(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  const active = selects.filter((select) => values[select.name]);

  return (
    <div className="space-y-2.5 rounded-xl border border-line bg-card px-4 py-3.5">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <p className="text-[12px] font-medium text-fg-soft lg:mr-1">Filter the dashboard</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:flex lg:flex-wrap">
          {selects.map((select) => (
            <FilterSelectControl
              key={select.name}
              select={select}
              value={values[select.name] ?? ""}
              onChange={(value) => navigate({ [select.name]: value || undefined })}
            />
          ))}
        </div>
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-glow" aria-live="polite">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            Updating
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground" aria-live="polite">
        {active.length === 0 ? (
          <p>
            Showing all records.{" "}
            {selects.map((select) => `${select.label} narrows ${select.scope}`).join("; ")}.
          </p>
        ) : (
          <>
            <p>
              <span className="font-medium text-warning-fg">Filtered:</span>{" "}
              {active
                .map((select) => {
                  const value = values[select.name];
                  const label = select.options.find((option) => option.value === value)?.label ?? value;
                  return `${select.label} ${label} (applies to ${select.scope})`;
                })
                .join("; ")}
              .
            </p>
            <button
              type="button"
              onClick={() => navigate(Object.fromEntries(selects.map((select) => [select.name, undefined])))}
              className="inline-flex items-center gap-1 rounded text-glow hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden />
              Reset filters
            </button>
          </>
        )}
      </div>
    </div>
  );
}
