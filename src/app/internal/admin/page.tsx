import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { DetailSection } from "@/components/internal/ui/detail";
import { appRoles, roleDescriptions, roleLabels } from "@/lib/auth/roles";
import { requireAdministration } from "@/lib/internal/admin-access";

export const metadata: Metadata = { title: "Administration" };

export default async function AdministrationOverviewPage() {
  await requireAdministration();

  return (
    <DetailSection title="Roles" icon={ShieldCheck}>
      <dl className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
        {appRoles.map((role) => (
          <div key={role}>
            <dt className="text-[13px] font-medium text-foreground">{roleLabels[role]}</dt>
            <dd className="mt-0.5 text-[13px] text-fg-subtle">{roleDescriptions[role]}</dd>
          </div>
        ))}
      </dl>
    </DetailSection>
  );
}
