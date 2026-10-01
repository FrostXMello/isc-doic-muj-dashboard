import { StudentPortalNav } from "@/components/student-portal/student-portal-nav";

export default function StudentPortalLayout({ children }: LayoutProps<"/student-portal">) {
  return (
    <div className="pt-[4.5rem]">
      <StudentPortalNav />
      {children}
    </div>
  );
}
