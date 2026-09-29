import { ClassroomSection } from "@/components/editorial/classroom-section";
import { Cta } from "@/components/cta/cta";
import { Hero } from "@/components/hero/hero";
import { OpportunitiesSection } from "@/components/opportunities/opportunities-section";
import { PartnerPreview } from "@/components/partner-preview/partner-preview";
import { Stats } from "@/components/stats/stats";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <ClassroomSection />
      <OpportunitiesSection />
      <PartnerPreview />
      <Cta />
    </>
  );
}
