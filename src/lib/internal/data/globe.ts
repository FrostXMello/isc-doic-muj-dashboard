/**
 * Home-page globe from the current MoU list: the universities the portal
 * lists (official records plus the DoIC MoU register, with MoUs that ended
 * before this year retired), one node per country.
 *
 * Nodes sit at the country's reference point from official/countries, never
 * at a campus. Only counts leave this module: no names, dates or contacts.
 */

import { retireStaleAgreements } from "@/lib/internal/data/current";
import { canonicalDataset, staticDataset } from "@/lib/internal/data/dataset";
import { registerScope, withRegisterSnapshot } from "@/lib/internal/data/register-snapshot";
import { todayISO } from "@/lib/internal/dates";
import { countryById, officialRegions } from "@/lib/official/countries";
import type { GlobeMarker } from "@/lib/official/geo";
import type { OfficialRegion } from "@/lib/official/types";

export const REGISTER_GLOBE_SOURCE = "DoIC MoU register";

export type RegisterGlobe = {
  markers: GlobeMarker[];
  totals: { universities: number; mous: number; countries: number };
};

export function registerGlobe(today: string = todayISO()): RegisterGlobe {
  const { data } = retireStaleAgreements(
    canonicalDataset(withRegisterSnapshot(staticDataset(false))),
    today,
    registerScope,
  );
  const mousByInstitution = new Map<string, number>();
  for (const agreement of data.agreements) {
    mousByInstitution.set(agreement.institutionId, (mousByInstitution.get(agreement.institutionId) ?? 0) + 1);
  }

  const byCountry = new Map<string, { country: string; region: OfficialRegion; universities: number; mous: number }>();
  for (const institution of data.institutions) {
    const mous = mousByInstitution.get(institution.id);
    if (!mous) continue;
    const entry = byCountry.get(institution.countryId);
    if (entry) {
      entry.universities += 1;
      entry.mous += mous;
    } else {
      byCountry.set(institution.countryId, {
        country: institution.country,
        region: institution.region as OfficialRegion,
        universities: 1,
        mous,
      });
    }
  }

  const markers: GlobeMarker[] = [...byCountry]
    .map(([countryId, entry]) => {
      const reference = countryById(countryId);
      return {
        id: `country-${countryId}`,
        precision: "country" as const,
        countryId,
        country: entry.country,
        region: entry.region,
        alsoListedUnder: [],
        lat: reference.lat,
        lon: reference.lon,
        institutions: entry.universities,
        agreementRows: entry.mous,
        source: { label: REGISTER_GLOBE_SOURCE, url: "" },
      };
    })
    .sort(
      (a, b) =>
        officialRegions.indexOf(a.region) - officialRegions.indexOf(b.region) ||
        b.institutions - a.institutions ||
        a.country.localeCompare(b.country),
    );

  return {
    markers,
    totals: {
      universities: markers.reduce((sum, marker) => sum + (marker.precision === "country" ? marker.institutions : 0), 0),
      mous: markers.reduce((sum, marker) => sum + marker.agreementRows, 0),
      countries: markers.length,
    },
  };
}
