import { StudentPortalNav } from "@/components/student-portal/student-portal-nav";
import { getAccountSummary, requirePortalAccess } from "@/lib/auth/session";

export default async function StudentPortalLayout({ children }: LayoutProps<"/student-portal">) {
  await requirePortalAccess("student", "/student-portal");
  const account = await getAccountSummary();

  return (
    <div className="pt-[4.5rem]">
      <StudentPortalNav account={account} />
      {children}
    </div>
  );
}
