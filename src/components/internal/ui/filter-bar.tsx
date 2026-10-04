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
    <div className="dash-rise space-y-4" style={{ animationDelay: "120ms" }}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="group relative min-w-0 lg:w-80 lg:flex-none">
          <label htmlFor={searchId} className="sr-only">
            {searchPlaceholder}
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-fg-faint transition-colors group-focus-within:text-muj-fg"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-full border border-line-strong bg-card pr-10 pl-11 text-[14px] text-foreground transition-colors placeholder:text-fg-faint hover:border-line-bold focus:border-muj/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-muj/15"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1.5 text-fg-faint transition-colors hover:bg-overlay hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
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

      <div className="flex min-h-8 flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <p aria-live="polite" className="flex items-baseline gap-1.5">
          <span className="font-display text-[1.6rem] leading-none font-medium tracking-[-0.04em] text-foreground tabular-nums">
            {resultCount}
          </span>
          <span>
            of <span className="tabular-nums">{totalCount}</span>{" "}
            {totalCount === 1 ? noun.singular : noun.plural}
          </span>
        </p>
        {pending && (
          <span className="inline-flex items-center gap-1.5 text-muj-fg">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            Updating
          </span>
        )}
        {active && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-full text-muj-fg transition-colors hover:text-foreground"
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
          "h-11 w-full cursor-pointer appearance-none rounded-full border pr-10 pl-4 text-[13px] transition-colors focus:border-muj/70 focus:outline-none focus-visible:ring-4 focus-visible:ring-muj/15 lg:min-w-40",
          isSet
            ? "border-muj/60 bg-muj/[0.08] font-medium text-foreground"
            : "border-line-strong bg-card text-muted-foreground hover:border-line-bold hover:text-foreground",
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
        className={cn(
          "pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2",
          isSet ? "text-muj-fg" : "text-fg-faint",
        )}
        aria-hidden
      />
    </div>
  );
}
