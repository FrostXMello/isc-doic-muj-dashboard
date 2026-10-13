import type { Metadata } from "next";
import { Lock, SlidersHorizontal } from "lucide-react";
import { RecordForm } from "@/components/internal/forms/record-form";
import { DetailSection } from "@/components/internal/ui/detail";
import { EmptyState } from "@/components/internal/ui/empty-state";
import { RecordNotice } from "@/components/internal/ui/record-notice";
import { requireAdministration } from "@/lib/internal/admin-access";
import { saveSettings } from "@/lib/internal/content-actions";
import { loadPortalSettings } from "@/lib/internal/data/portal-settings";
import { formatDate } from "@/lib/internal/dates";
import { can } from "@/lib/internal/permissions";
import type { SearchParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Portal settings" };

export default async function AdminSettingsPage({ searchParams }: SearchParamsProp) {
  const auth = await requireAdministration("settings:read");
  const settings = await loadPortalSettings();
  const editable = can(auth.roles, "settings:update");

  return (
    <div className="space-y-6">
      <RecordNotice query={await searchParams} />
      <DetailSection
        title="Access contact"
        icon={SlidersHorizontal}
        description={`Shown to signed-in people who have no access yet, and on the "not authorised" page.${
          settings !== "unavailable" && settings.updatedAt ? ` Last changed ${formatDate(settings.updatedAt.slice(0, 10))}.` : ""
        }`}
      >
        {settings === "unavailable" ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="Settings aren't available yet"
            description="They need the admin-control database migration (20261005090100_admin_control). Until then the built-in contact text is shown."
          />
        ) : editable ? (
          <RecordForm
            action={saveSettings}
            groups={[
              {
                fields: [
                  { kind: "email", name: "accessContactEmail", label: "Contact email (optional)", maxLength: 254 },
                  {
                    kind: "textarea",
                    name: "accessContactNote",
                    label: "Note (optional)",
                    maxLength: 300,
                    rows: 3,
                    hint: "Plain text, up to 300 characters, e.g. who to ask and what to include.",
                  },
                ],
              },
            ]}
            initial={{ accessContactEmail: settings.accessContactEmail, accessContactNote: settings.accessContactNote }}
            submitLabel="Save settings"
            cancelHref="/internal/admin"
          />
        ) : (
          <p className="px-6 pb-6 text-[13px] text-fg-soft">
            {settings.accessContactEmail ?? "No contact email set."} {settings.accessContactNote}
          </p>
        )}
      </DetailSection>

      <DetailSection
        title="Not editable here, by design"
        icon={Lock}
        description="Security controls are never free-form settings."
      >
        <ul className="list-disc space-y-1.5 px-6 pb-6 pl-10 text-[13px] text-fg-subtle">
          <li>Roles, permissions, and row level security are defined in reviewed database migrations.</li>
          <li>Sign-in, password, and session rules are configured in Supabase Auth by the project owner.</li>
          <li>The first Super admin is provisioned by the database owner with a reviewed script.</li>
          <li>Expiry and deadline warning windows are counting rules in code, so dashboards and tests stay consistent.</li>
        </ul>
      </DetailSection>
    </div>
  );
}
