import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { UniversityForm } from "@/components/internal/forms/university-form";
import { DetailHeader, DetailSection } from "@/components/internal/ui/detail";
import { ReadOnlySourceNotice, requireManage } from "@/components/internal/ui/manage-action";
import { listCountryOptions } from "@/lib/internal/data/form-options";

export const metadata: Metadata = { title: "Add university" };

export default async function NewUniversityPage() {
  const access = await requireManage("institutions:create");

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/internal/universities"
        backLabel="All universities"
        title="Add university"
        subtitle="Institutional details only. Add its MoUs from the university's page once it is saved."
      />
      {access === "static" ? (
        <ReadOnlySourceNotice />
      ) : (
        <DetailSection title="University details" icon={GraduationCap}>
          <UniversityForm
            cancelHref="/internal/universities"
            countries={await listCountryOptions()}
            initial={{
              slug: null,
              name: "",
              normalizedName: null,
              countrySlug: null,
              city: null,
              website: null,
              note: null,
              isPublic: false,
              verification: "unverified",
              sourceUrl: null,
            }}
          />
        </DetailSection>
      )}
    </div>
  );
}
