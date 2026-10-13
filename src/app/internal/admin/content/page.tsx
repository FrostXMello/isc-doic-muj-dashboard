import type { Metadata } from "next";
import { Database } from "lucide-react";
import Link from "next/link";
import { DetailSection } from "@/components/internal/ui/detail";
import { ManageLink } from "@/components/internal/ui/manage-action";
import { requireAdministration } from "@/lib/internal/admin-access";
import { openDataContext } from "@/lib/internal/data/context";
import type { Permission } from "@/lib/internal/permissions";

export const metadata: Metadata = { title: "Content and records" };

type Row = {
  label: string;
  total: number;
  archived: number | null;
  archivedMeans?: string;
  listHref: string;
  newHref: string;
  create: Permission;
};

export default async function AdminContentPage() {
  await requireAdministration("institutions:read");
  const { data, source } = await openDataContext();

  const rows: Row[] = [
    { label: "Universities", total: data.institutions.length, archived: null, listHref: "/internal/universities", newHref: "/internal/universities/new", create: "institutions:create" },
    { label: "MoUs and agreements", total: data.agreements.length, archived: data.agreements.filter((row) => row.recordStatus === "terminated").length, archivedMeans: "terminated", listHref: "/internal/universities", newHref: "/internal/universities", create: "agreements:create" },
    { label: "Programmes", total: data.programs.length, archived: null, listHref: "/internal/programs", newHref: "/internal/programs/new?type=programme", create: "programs:create" },
    { label: "Programme offerings", total: data.availability.length, archived: null, listHref: "/internal/programs", newHref: "/internal/programs/new", create: "programs:create" },
    { label: "Calls (opportunities)", total: data.opportunities.length, archived: data.opportunities.filter((row) => row.recordStatus === "archived").length, archivedMeans: "archived", listHref: "/internal/programs?tab=opportunities", newHref: "/internal/opportunities/new", create: "opportunities:create" },
    { label: "Activities", total: data.activities.length, archived: data.activities.filter((row) => row.recordStatus === "cancelled").length, archivedMeans: "cancelled", listHref: "/internal/activities", newHref: "/internal/activities/new", create: "activities:create" },
    { label: "Documents and reports", total: data.documents.length, archived: data.documents.filter((row) => row.status === "archived").length, archivedMeans: "archived", listHref: "/internal/documents", newHref: "/internal/documents/new", create: "documents:create" },
  ];

  return (
    <DetailSection
      title="Records"
      icon={Database}
      description={
        source === "supabase"
          ? "Counts are live from the database, as your role can see them. Open a section to search, filter, edit, archive, or delete; MoUs are added from their university's page."
          : "This deployment reads the bundled official dataset, so records are read-only here."
      }
    >
      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full min-w-[560px] border-collapse text-[13px]">
          <caption className="sr-only">Records by type</caption>
          <thead>
            <tr className="border-b border-hairline text-left text-[11px] tracking-[0.1em] text-fg-faint uppercase">
              <th scope="col" className="py-2 pr-4 font-medium">Record type</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Total</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Archived</th>
              <th scope="col" className="py-2 pl-4 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-hairline">
                <th scope="row" className="py-2.5 pr-4 text-left font-normal">
                  <Link href={row.listHref} className="text-foreground underline-offset-4 hover:underline">
                    {row.label}
                  </Link>
                </th>
                <td className="px-2 py-2.5 text-right tabular-nums">{row.total}</td>
                <td className="px-2 py-2.5 text-right text-fg-subtle tabular-nums">
                  {row.archived === null ? "—" : `${row.archived} ${row.archivedMeans}`}
                </td>
                <td className="py-2.5 pl-4 text-right">
                  {row.newHref !== row.listHref ? (
                    <ManageLink permission={row.create} href={row.newHref} label="New" icon="add" size="sm" />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DetailSection>
  );
}
