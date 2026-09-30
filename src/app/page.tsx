import { ClassroomSection } from "@/components/editorial/classroom-section";
import { Cta } from "@/components/cta/cta";
import { Hero } from "@/components/hero/hero";
import { OpportunitiesSection } from "@/components/opportunities/opportunities-section";
import { PartnerPreview } from "@/components/partner-preview/partner-preview";
import { Stats } from "@/components/stats/stats";
import { officialStats, partnerCountries, publicRegions } from "@/lib/official/public";
import { officialSources, SOURCE_REVIEWED_ON } from "@/lib/official/source";

const figures = [
  { id: "institutions", value: officialStats.institutions, label: "Partner institutions listed" },
  { id: "rows", value: officialStats.collaborationRows, label: "Collaboration entries on the partner page" },
  { id: "countries", value: officialStats.countries, label: "Countries" },
  { id: "regions", value: officialStats.regions, label: "Regional headings" },
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats
        figures={figures}
        sourceUrl={officialSources.partners.url}
        checkedOn={SOURCE_REVIEWED_ON}
      />
      <ClassroomSection />
      <OpportunitiesSection />
      <PartnerPreview
        countries={partnerCountries}
        regions={publicRegions}
        sourceUrl={officialSources.partners.url}
      />
      <Cta />
    </>
  );
}
