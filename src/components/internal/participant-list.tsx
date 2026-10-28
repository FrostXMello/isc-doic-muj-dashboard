import { Users } from "lucide-react";
import Link from "next/link";
import { DetailSection } from "@/components/internal/ui/detail";
import { type EventParticipant, uniquePeople } from "@/lib/internal/participants";

const collator = new Intl.Collator("en", { sensitivity: "base" });

function Institution({ row }: { row: EventParticipant }) {
  if (!row.institution) return <span className="text-fg-faint">Not recorded</span>;
  if (!row.partnerId) return <>{row.institution}</>;
  return (
    <Link href={`/internal/universities/${row.partnerId}`} className="text-muj-fg hover:underline">
      {row.institution}
      <span className="ml-1.5 rounded-full bg-overlay px-1.5 py-0.5 text-[10px] tracking-wide text-fg-soft uppercase">Partner</span>
    </Link>
  );
}

const dash = (value: string | null) => value ?? <span className="text-fg-faint">—</span>;

/** Everyone who took part, from DoIC's participant lists, sorted by name. Internal only. */
export function ParticipantList({ rows, source }: { rows: readonly EventParticipant[]; source: string }) {
  const sorted = [...rows].sort((a, b) => collator.compare(a.name, b.name) || collator.compare(a.course ?? "", b.course ?? ""));
  const people = uniquePeople(rows).length;
  return (
    <DetailSection
      id="participants"
      title="Participants"
      icon={Users}
      description={`${people} ${people === 1 ? "participant" : "participants"}${rows.length > people ? `, ${rows.length} course enrolments` : ""} · ${source}. Internal: contains personal details.`}
    >
      <div className="hidden overflow-x-auto px-4 pb-6 sm:px-6 md:block">
        <table className="w-full min-w-[56rem] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-line text-[11px] tracking-[0.06em] text-fg-faint uppercase">
              <th className="py-2 pr-3 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Name</th>
              <th className="py-2 pr-3 font-medium">Institution</th>
              <th className="py-2 pr-3 font-medium">Country</th>
              <th className="py-2 pr-3 font-medium">Course</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 font-medium">Gender</th>
              <th className="py-2 pr-3 font-medium">Mode</th>
              <th className="py-2 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => (
              <tr key={row.id} className="border-b border-hairline align-top hover:bg-overlay">
                <td className="py-2 pr-3 text-fg-faint tabular-nums">{index + 1}</td>
                <td className="py-2 pr-3 font-medium text-foreground">
                  {row.name}
                  {row.qualification ? <span className="block text-[11.5px] font-normal text-fg-faint">{row.qualification}</span> : null}
                </td>
                <td className="py-2 pr-3 text-fg-soft">
                  <Institution row={row} />
                </td>
                <td className="py-2 pr-3 text-fg-soft">{dash(row.country)}</td>
                <td className="py-2 pr-3 text-fg-soft">{dash(row.course)}</td>
                <td className="py-2 pr-3 text-fg-soft">{dash(row.category)}</td>
                <td className="py-2 pr-3 text-fg-soft">{dash(row.gender)}</td>
                <td className="py-2 pr-3 text-fg-soft">{dash(row.mode)}</td>
                <td className="py-2 text-fg-soft [overflow-wrap:anywhere]">
                  {row.email ? (
                    <a href={`mailto:${row.email}`} className="hover:text-muj-fg hover:underline">
                      {row.email}
                    </a>
                  ) : (
                    dash(null)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="divide-y divide-hairline px-4 pb-4 md:hidden">
        {sorted.map((row) => (
          <li key={row.id} className="py-3 text-[13px]">
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="mt-0.5 text-fg-soft">
              <Institution row={row} />
              {row.country ? ` · ${row.country}` : null}
            </p>
            {row.course ? <p className="mt-0.5 text-fg-faint">{row.course}</p> : null}
            <p className="mt-0.5 text-[12px] text-fg-faint">
              {[row.category, row.gender, row.mode].filter(Boolean).join(" · ")}
            </p>
            {row.email ? (
              <a href={`mailto:${row.email}`} className="mt-0.5 inline-flex min-h-8 items-center text-[12px] text-muj-fg [overflow-wrap:anywhere]">
                {row.email}
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </DetailSection>
  );
}
