import type { Metadata } from "next";
import { Database, Link2, Lock } from "lucide-react";
import { DetailSection, KeyValueList } from "@/components/internal/ui/detail";
import { PageHeader } from "@/components/internal/ui/page-header";
import { RESTRICTED_CONTACTS, SourceLink } from "@/components/internal/ui/provenance";
import { openDataContext } from "@/lib/internal/data/context";
import { formatDate } from "@/lib/internal/dates";
import { officialSources, SOURCE_REVIEWED_ON } from "@/lib/official/source";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { source, sampleData, data, contactAccess } = await openDataContext();
  const count = (rows: readonly { source: string }[], kind: string) =>
    rows.filter((row) => row.source === kind).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Where the portal's data comes from and which switches are on. Editing, users, and preferences arrive in a later stage."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DetailSection title="Data source" icon={Database}>
          <KeyValueList
            className="sm:grid-cols-1"
            items={[
              {
                label: "Store",
                value:
                  source === "supabase"
                    ? "Supabase (row level security, read as the signed-in user)"
                    : "Static official dataset bundled with the site",
              },
              {
                label: "Sample data (INTERNAL_SAMPLE_DATA)",
                value: sampleData
                  ? "On — fictional sample records are mixed in and badged"
                  : "Off — only official and earlier-directory records are shown",
              },
              {
                label: "Records loaded",
                value: `${count(data.institutions, "official")} official institutions · ${count(data.agreements, "official")} official collaboration rows · ${count(data.institutions, "directory")} earlier-directory names${sampleData ? ` · ${count(data.institutions, "sample")} sample institutions` : ""}`,
              },
              { label: "Official source reviewed", value: formatDate(SOURCE_REVIEWED_ON) },
            ]}
          />
        </DetailSection>

        <DetailSection title="Nodal contacts" icon={Lock}>
          <KeyValueList
            className="sm:grid-cols-1"
            items={[
              {
                label: "Access",
                value:
                  contactAccess.state === "granted"
                    ? `Granted — ${contactAccess.contacts.length} contacts visible to your internal role`
                    : RESTRICTED_CONTACTS,
              },
              {
                label: "How contacts are stored",
                value:
                  "Only in the institution_contacts table in Supabase, readable by internal DoIC roles under row level security. They are never bundled into the site or shown on public pages.",
              },
            ]}
          />
        </DetailSection>
      </div>

      <DetailSection
        title="Official sources"
        icon={Link2}
        description="Pages on jaipur.manipal.edu the dataset was imported from. Records link back to the specific page."
      >
        <ul className="divide-y divide-hairline">
          {Object.entries(officialSources).map(([key, page]) => (
            <li key={key} className="px-5 py-3 text-[13px]">
              <SourceLink url={page.url} title={page.title} />
            </li>
          ))}
        </ul>
      </DetailSection>
    </div>
  );
}
