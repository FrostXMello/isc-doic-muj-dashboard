import { AdminNav } from "@/components/internal/admin-nav";
import { PageHeader } from "@/components/internal/ui/page-header";
import { requireAdministration, visibleAdminSections } from "@/lib/internal/admin-access";
import { isAdmin } from "@/lib/internal/permissions";

export default async function AdministrationLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdministration();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isAdmin(auth.roles) ? "Administration" : "Administration · read-only"}
        title="Administration"
        description="Manage records, accounts, and portal settings within your role's authority. Every change is checked by the database and recorded in the audit history."
      />
      <AdminNav links={visibleAdminSections(auth.roles)} />
      <div>{children}</div>
    </div>
  );
}
