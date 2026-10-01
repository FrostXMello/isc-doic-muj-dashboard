import { ClassroomSection } from "@/components/editorial/classroom-section";
import { Cta } from "@/components/cta/cta";
import { Hero } from "@/components/hero/hero";
import { OpportunitiesSection } from "@/components/opportunities/opportunities-section";
import { PartnerPreview } from "@/components/partner-preview/partner-preview";
import { Stats } from "@/components/stats/stats";
import { globeTotals } from "@/lib/official/geo";
import { partnerCountries, publicRegions } from "@/lib/official/public";
import { officialSources } from "@/lib/official/source";

const figures = [
  { id: "institutions", value: globeTotals.institutions, label: "Official partner institutions" },
  { id: "rows", value: globeTotals.agreementRows, label: "Agreement records listed" },
  { id: "countries", value: globeTotals.countries, label: "Partner countries" },
  { id: "regions", value: globeTotals.regions, label: "Regions, as headed on the official page" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats figures={figures} sourceUrl={globeTotals.sourceUrl} checkedOn={globeTotals.checkedOn} />
      <OpportunitiesSection />
      <PartnerPreview
        countries={partnerCountries}
        regions={publicRegions}
        sourceUrl={officialSources.partners.url}
      />
      <ClassroomSection />
      <Cta />
    </>
  );
}
