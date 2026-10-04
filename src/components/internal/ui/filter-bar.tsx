"use client";

import { ChevronDown, LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
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

  // The URL only changes once a navigation commits. Until then this holds the
  // search string last requested, so a filter change and a pending search build
  // on each other instead of one overwriting the other with stale params.
  const requestedSearch = useRef(params.toString());
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    requestedSearch.current = params.toString();
  }, [params]);

  function replaceParams(patch: Record<string, string | undefined>) {
    clearTimeout(searchTimer.current);
    const next = new URLSearchParams(requestedSearch.current);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    requestedSearch.current = qs;
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function navigate(patch: Record<string, string | undefined>) {
    replaceParams({ q: query.trim() || undefined, ...patch });
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === (new URLSearchParams(requestedSearch.current).get("q") ?? "")) return;
    searchTimer.current = setTimeout(() => replaceParams({ q: trimmed || undefined }), SEARCH_DEBOUNCE_MS);
    // A pending search would otherwise replace a link click or Back with this
    // page's URL, so drop it as soon as the user navigates elsewhere.
    const abandon = (event: Event) => {
      const navigates = event.target instanceof Element && event.target.closest("a[href], [data-row-href]");
      if (event.type === "click" && !navigates) return;
      clearTimeout(searchTimer.current);
      setQuery(urlQuery);
    };
    document.addEventListener("click", abandon, true);
    window.addEventListener("popstate", abandon);
    return () => {
      clearTimeout(searchTimer.current);
      document.removeEventListener("click", abandon, true);
      window.removeEventListener("popstate", abandon);
    };
    // replaceParams reads refs and the current pathname; params re-runs the check after a commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, urlQuery, params, pathname]);

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
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-faint"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-lg border border-line bg-card pr-9 pl-9 text-[13px] text-foreground placeholder:text-fg-faint focus:border-glow/50 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-fg-faint hover:text-foreground"
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
          <span className="inline-flex items-center gap-1.5 text-glow">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            Updating
          </span>
        )}
        {active && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded text-glow hover:text-foreground"
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
          "h-10 w-full appearance-none rounded-lg border bg-card pr-9 pl-3 text-[13px] focus:border-glow/50 focus:outline-none lg:min-w-40",
          isSet ? "border-glow/40 text-foreground" : "border-line text-muted-foreground",
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
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-faint"
        aria-hidden
      />
    </div>
  );
}
