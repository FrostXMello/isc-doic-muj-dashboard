import type { Metadata } from "next";
import { Check, Minus, ShieldCheck } from "lucide-react";
import { DetailSection } from "@/components/internal/ui/detail";
import { appRoles, roleDescriptions, roleLabels } from "@/lib/auth/roles";
import { requireAdministration } from "@/lib/internal/admin-access";
import { can, type Permission, rolesForNewAccount } from "@/lib/internal/permissions";

export const metadata: Metadata = { title: "Administration" };

const capabilities: { label: string; permission: Permission }[] = [
  { label: "Read records, reports, and dashboards", permission: "institutions:read" },
  { label: "Export CSV", permission: "reports:export" },
  { label: "Create and edit records", permission: "institutions:update" },
  { label: "Archive and restore records", permission: "institutions:archive" },
  { label: "Upload document files", permission: "documents:upload" },
  { label: "Delete records and files", permission: "institutions:delete" },
  { label: "Manage accounts within authority", permission: "users:manage" },
  { label: "Edit portal settings", permission: "settings:update" },
  { label: "Read the audit history", permission: "audit:read" },
];

function Mark({ on, label }: { on: boolean; label: string }) {
  return on ? (
    <Check className="mx-auto size-4 text-success-fg" aria-label={`${label}: yes`} />
  ) : (
    <Minus className="mx-auto size-4 text-fg-faint" aria-label={`${label}: no`} />
  );
}

export default async function AdministrationOverviewPage() {
  const auth = await requireAdministration();

  return (
    <div className="space-y-6">
      <DetailSection
        title="Roles and permissions"
        icon={ShieldCheck}
        description="The same matrix is enforced by row level security in the database; hiding a control is never the only protection. Nobody can change their own roles, and the last active Super admin can't be removed."
      >
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-[13px]">
            <caption className="sr-only">Capabilities by role</caption>
            <thead>
              <tr className="border-b border-hairline text-left text-[11px] tracking-[0.1em] text-fg-faint uppercase">
                <th scope="col" className="w-[28%] py-2 pr-4 font-medium">
                  Capability
                </th>
                {appRoles.map((role) => (
                  <th key={role} scope="col" className="px-2 py-2 text-center font-medium">
                    {roleLabels[role]}
                    {auth.roles.includes(role) ? <span className="sr-only"> (your role)</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capabilities.map((capability) => (
                <tr key={capability.permission} className="border-b border-hairline">
                  <th scope="row" className="py-2.5 pr-4 text-left font-normal text-fg-soft">
                    {capability.label}
                  </th>
                  {appRoles.map((role) => (
                    <td key={role} className="px-2 py-2.5 text-center">
                      <Mark on={can([role], capability.permission)} label={roleLabels[role]} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-hairline align-top">
                <th scope="row" className="py-2.5 pr-4 text-left font-normal text-fg-soft">
                  Roles it may grant or revoke on others
                </th>
                {appRoles.map((role) => {
                  const grants = rolesForNewAccount([role]);
                  return (
                    <td key={role} className="px-2 py-2.5 text-center text-[12px] text-fg-subtle">
                      {grants.length === 0 ? <Minus className="mx-auto size-4 text-fg-faint" aria-label="None" /> : grants.map((r) => roleLabels[r]).join(", ")}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </DetailSection>

      <DetailSection title="What each role is for">
        <dl className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
          {appRoles.map((role) => (
            <div key={role}>
              <dt className="text-[13px] font-medium text-foreground">{roleLabels[role]}</dt>
              <dd className="mt-0.5 text-[13px] text-fg-subtle">{roleDescriptions[role]}</dd>
            </div>
          ))}
        </dl>
        <p className="px-6 pb-6 text-[12px] text-fg-faint">
          The first Super admin is provisioned by the database owner with a reviewed script, never through sign-up or this
          interface. Administrator roles can only be granted by a Super admin.
        </p>
      </DetailSection>
    </div>
  );
}
