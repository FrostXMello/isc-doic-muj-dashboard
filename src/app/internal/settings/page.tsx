import type { Metadata } from "next";
import { Database, Lock, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { RoleManagement } from "@/components/internal/role-management";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { DetailSection, KeyValueList } from "@/components/internal/ui/detail";
import { PageHeader } from "@/components/internal/ui/page-header";
import { RESTRICTED_CONTACTS } from "@/components/internal/ui/provenance";
import { getAccountSummary } from "@/lib/auth/session";
import { openDataContext } from "@/lib/internal/data/context";
import { formatDate } from "@/lib/internal/dates";
import { SOURCE_REVIEWED_ON } from "@/lib/official/source";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [{ source, sampleData, data, contactAccess }, account] = await Promise.all([
    openDataContext(),
    getAccountSummary(),
  ]);
  const count = (rows: readonly { source: string }[], kind: string) =>
    rows.filter((row) => row.source === kind).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Account & access"
        title="Settings"
        description="Your account, where the portal's data comes from, and which switches are on. DoIC admins also manage portal access here."
      />

      {account ? (
        <DetailSection
          title="Your account"
          icon={UserRound}
          action={
            <SignOutButton className={buttonClass("secondary", "sm")} />
          }
        >
          <KeyValueList
            items={[
              ...(account.name ? [{ label: "Name", value: account.name }] : []),
              { label: "Email", value: account.email ?? "—" },
              { label: "Access level", value: account.accessLevel },
            ]}
          />
        </DetailSection>
      ) : null}

      <RoleManagement />

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
    </div>
  );
}
