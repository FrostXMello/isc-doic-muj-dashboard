"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

/** One institution as the public directory needs it (serialisable). */
export type DirectoryEntry = {
  slug: string;
  name: string;
  listedName: string;
  country: string;
  region: string;
  /** Agreement wording per official row (e.g. "MoU", "type not stated"). */
  agreementKinds: string[];
  /** Short line under the name. */
  detail: string;
};

export function PartnerDirectory({
  institutions,
  regions,
  agreementKinds,
}: {
  institutions: readonly DirectoryEntry[];
  regions: readonly string[];
  agreementKinds: readonly string[];
}) {
  type Institution = DirectoryEntry;
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [country, setCountry] = useState("all");
  const [kind, setKind] = useState("all");
  const searchId = useId();
  const regionId = useId();
  const countryId = useId();
  const kindId = useId();

  const countries: string[] = [];
  for (const institution of institutions) {
    if (region !== "all" && institution.region !== region) continue;
    if (!countries.includes(institution.country)) countries.push(institution.country);
  }
  const countryActive = countries.includes(country) ? country : "all";
  const needle = query.trim().toLowerCase();

  const visible = institutions.filter((institution) => {
    if (region !== "all" && institution.region !== region) return false;
    if (countryActive !== "all" && institution.country !== countryActive) return false;
    if (kind !== "all" && !institution.agreementKinds.includes(kind)) return false;
    if (
      needle &&
      !institution.name.toLowerCase().includes(needle) &&
      !institution.listedName.toLowerCase().includes(needle)
    ) {
      return false;
    }
    return true;
  });

  const groups: {
    region: string;
    countries: { country: string; items: Institution[] }[];
  }[] = [];
  for (const institution of visible) {
    let regionGroup = groups.find((group) => group.region === institution.region);
    if (!regionGroup) {
      regionGroup = { region: institution.region, countries: [] };
      groups.push(regionGroup);
    }
    let countryGroup = regionGroup.countries.find((group) => group.country === institution.country);
    if (!countryGroup) {
      countryGroup = { country: institution.country, items: [] };
      regionGroup.countries.push(countryGroup);
    }
    countryGroup.items.push(institution);
  }

  const filtered =
    needle.length > 0 || region !== "all" || countryActive !== "all" || kind !== "all";
  const clear = () => {
    setQuery("");
    setRegion("all");
    setCountry("all");
    setKind("all");
  };
  let number = 0;

  return (
    <div className="mt-12">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        Region, then country, then institution
      </p>
      <form
        className="mt-3 grid gap-4 border-y border-line py-5 md:grid-cols-2 xl:grid-cols-4"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="min-w-0">
          <label
            htmlFor={regionId}
            className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
          >
            Region
          </label>
          <select
            id={regionId}
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            className="mt-2 h-11 w-full max-w-full border border-line-strong bg-background px-3 text-sm text-foreground outline-none focus-visible:border-cyan"
          >
            <option value="all">All regions</option>
            {regions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={countryId}
            className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
          >
            Country
          </label>
          <select
            id={countryId}
            value={countryActive}
            onChange={(event) => setCountry(event.target.value)}
            className="mt-2 h-11 w-full max-w-full border border-line-strong bg-background px-3 text-sm text-foreground outline-none focus-visible:border-cyan"
          >
            <option value="all">All countries</option>
            {countries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={kindId}
            className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
          >
            Agreement wording
          </label>
          <select
            id={kindId}
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="mt-2 h-11 w-full max-w-full border border-line-strong bg-background px-3 text-sm text-foreground outline-none focus-visible:border-cyan"
          >
            <option value="all">Any</option>
            {agreementKinds.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0">
          <label
            htmlFor={searchId}
            className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase"
          >
            Institution
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by institution"
            autoComplete="off"
            className="mt-2 h-11 w-full max-w-full border border-line-strong bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-cyan"
          />
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing {visible.length} of {institutions.length} institutions
        </p>
        {filtered ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex min-h-11 items-center px-1 text-[12px] tracking-[0.12em] text-primary uppercase transition-colors hover:text-foreground"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-2 border-t border-line">
        {visible.length === 0 ? (
          <div className="py-10">
            <p className="font-display text-xl tracking-[-0.03em] text-foreground">
              No institution matches
              {needle ? ` “${query.trim()}”` : ""}.
            </p>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {region !== "all" ? `Region: ${region}. ` : "All regions. "}
              {countryActive !== "all" ? `Country: ${countryActive}. ` : "All countries. "}
              {kind !== "all" ? `Agreement wording: ${kind}. ` : ""}
              Clear the filters to return to the full list.
            </p>
            <button
              type="button"
              onClick={clear}
              className="mt-4 inline-flex min-h-11 items-center border border-line-bold px-4 text-[12px] tracking-[0.12em] text-foreground uppercase"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div>
            {groups.map((regionGroup) => (
              <section
                key={regionGroup.region}
                aria-labelledby={`region-${regionGroup.region.replace(/\s+/g, "-")}`}
                className="pt-8"
              >
                <h2
                  id={`region-${regionGroup.region.replace(/\s+/g, "-")}`}
                  className="text-[11px] font-medium tracking-[0.2em] text-cyan uppercase"
                >
                  {regionGroup.region}
                </h2>
                {regionGroup.countries.map((countryGroup) => (
                  <div key={countryGroup.country} className="mt-4">
                    <h3 className="border-b border-line pb-2 font-display text-[1.2rem] tracking-[-0.03em] text-primary">
                      {countryGroup.country}
                    </h3>
                    <ul>
                      {countryGroup.items.map((institution) => {
                        number += 1;
                        const label = String(number).padStart(2, "0");
                        return (
                          <li key={institution.slug} className="border-b border-line">
                            <Link
                              href={`/partners/${institution.slug}`}
                              className={cn(
                                "group grid min-h-11 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-1 py-4 transition-[background-color,box-shadow] duration-200 hover:bg-overlay-subtle hover:shadow-[inset_2px_0_0_var(--cyan)] sm:px-2",
                              )}
                            >
                              <span className="font-mono text-[12px] tracking-[0.14em] text-fg-subtle transition-colors duration-200 group-hover:text-primary">
                                {label}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-display text-[1.15rem] leading-tight tracking-[-0.03em] text-foreground sm:text-[1.3rem]">
                                  {institution.name}
                                </span>
                                <span className="mt-1 block text-[13px] text-muted-foreground">
                                  {institution.detail}
                                </span>
                              </span>
                              <ArrowRight
                                className="size-4 text-muted-foreground transition-transform duration-200 group-hover:text-primary motion-safe:group-hover:translate-x-0.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
