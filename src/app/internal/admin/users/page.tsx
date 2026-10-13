import type { Metadata } from "next";
import { RoleManagement } from "@/components/internal/role-management";
import { appRoles } from "@/lib/auth/roles";
import { requireAdministration } from "@/lib/internal/admin-access";
import { accountStatuses } from "@/lib/internal/data/accounts";
import { readEnumParam, readParam, type SearchParamsProp } from "@/lib/internal/query";

export const metadata: Metadata = { title: "Users and roles" };

export default async function AdminUsersPage({ searchParams }: SearchParamsProp) {
  await requireAdministration("users:read");
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <RoleManagement
        filters={{
          q: readParam(params, "q"),
          role: readEnumParam(params, "role", appRoles),
          status: readEnumParam(params, "status", accountStatuses),
        }}
      />
    </div>
  );
}
