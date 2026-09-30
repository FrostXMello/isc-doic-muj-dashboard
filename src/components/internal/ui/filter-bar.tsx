"use client";

import { ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterSelect = {
  /** Query-string key, e.g. "status". */
  name: string;
  label: string;
  options: readonly FilterOption[];
  /** Label for the empty value. Omit for selects that always hold a value (e.g. sort). */
  allLabel?: string;
  /** Value treated as the default when the parameter is absent. */
  defaultValue?: string;
};

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search box and select filters backed by URL search params.
 *
 * The server page reads the same params and filters through the repository,
 * so every filtered view is shareable and survives a reload.
 */
export function FilterBar({
  searchPlaceholder = "Search",
  selects,
  resultCount,
  totalCount,
  noun,
}: {
  searchPlaceholder?: string;
  selects: readonly FilterSelect[];
  resultCount: number;
  totalCount: number;
  noun: { singular: string; plural: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const searchId = useId();

  const urlQuery = params.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  function navigate(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, urlQuery, params, pathname, router]);

  const filterKeys = ["q", ...selects.filter((s) => s.allLabel).map((s) => s.name)];
  const active = filterKeys.some((key) => params.get(key));

  function clearAll() {
    setQuery("");
    navigate(Object.fromEntries(filterKeys.map((key) => [key, undefined])));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-0 lg:w-72 lg:flex-none">
          <label htmlFor={searchId} className="sr-only">
            {searchPlaceholder}
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6b7c96]"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-lg border border-white/10 bg-[#0d1526] pr-9 pl-9 text-[13px] text-foreground placeholder:text-[#6b7c96] focus:border-[#8eb7ee]/50 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-[#6b7c96] hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:flex lg:flex-wrap">
          {selects.map((select) => (
            <FilterSelectControl
              key={select.name}
              select={select}
              value={params.get(select.name) ?? select.defaultValue ?? ""}
              onChange={(value) =>
                navigate({ [select.name]: value === select.defaultValue ? undefined : value })
              }
            />
          ))}
        </div>
      </div>

      <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
        <p aria-live="polite">
          Showing <span className="text-foreground tabular-nums">{resultCount}</span> of{" "}
          <span className="tabular-nums">{totalCount}</span>{" "}
          {totalCount === 1 ? noun.singular : noun.plural}
        </p>
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-[#8eb7ee]">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            Updating
          </span>
        )}
        {active && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded text-[#8eb7ee] hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

function FilterSelectControl({
  select,
  value,
  onChange,
}: {
  select: FilterSelect;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const isSet = Boolean(select.allLabel && value);
  return (
    <div className="relative min-w-0 lg:w-auto">
      <label htmlFor={id} className="sr-only">
        {select.label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-lg border bg-[#0d1526] pr-9 pl-3 text-[13px] focus:border-[#8eb7ee]/50 focus:outline-none lg:min-w-40",
          isSet ? "border-[#8eb7ee]/40 text-foreground" : "border-white/10 text-[#a9b6cc]",
        )}
      >
        {select.allLabel && <option value="">{select.allLabel}</option>}
        {select.options.map((option) => (
          <option key={option.value} value={option.value}>
            {select.allLabel ? option.label : `${select.label}: ${option.label}`}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-[#6b7c96]"
        aria-hidden
      />
    </div>
  );
}
