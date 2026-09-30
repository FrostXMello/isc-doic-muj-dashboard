import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Lifts the cell above the row's stretched link so buttons inside stay clickable. */
  interactive?: boolean;
};

/**
 * Responsive record list: a table from the `md` breakpoint up, stacked cards
 * below it. The first column links to the record; the whole row is clickable
 * through a stretched link so inner links remain usable.
 */
export function ResourceTable<T>({
  rows,
  columns,
  getKey,
  getHref,
  getRowLabel,
  renderCard,
  caption,
  empty,
}: {
  rows: readonly T[];
  columns: readonly Column<T>[];
  getKey: (row: T) => string;
  getHref: (row: T) => string;
  getRowLabel: (row: T) => string;
  renderCard: (row: T) => React.ReactNode;
  caption: string;
  empty: React.ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-line bg-card">{empty}</div>;
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-line bg-card md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-line">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 py-3 font-mono text-[10px] font-normal tracking-[0.12em] whitespace-nowrap text-fg-faint uppercase first:pl-5",
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                <th scope="col" className="w-10 px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((row) => (
                <tr
                  key={getKey(row)}
                  className="group relative transition-colors hover:bg-overlay-subtle focus-within:bg-overlay-subtle"
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3.5 align-middle text-[13px] text-fg-soft first:pl-5",
                        column.interactive && "relative z-10",
                        column.className,
                      )}
                    >
                      {index === 0 ? (
                        <Link
                          href={getHref(row)}
                          className="rounded-sm text-foreground outline-offset-2 after:absolute after:inset-0 after:content-[''] hover:text-primary"
                        >
                          {column.cell(row)}
                        </Link>
                      ) : (
                        column.cell(row)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-right">
                    <ChevronRight
                      className="ml-auto size-4 text-fg-dim transition-colors group-hover:text-fg-subtle"
                      aria-hidden
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="space-y-2.5 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={getKey(row)}>
            <Link
              href={getHref(row)}
              aria-label={getRowLabel(row)}
              className="block rounded-xl border border-line bg-card p-4 transition-colors hover:border-line-bold hover:bg-surface-raised"
            >
              {renderCard(row)}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Standard mobile card layout used with ResourceTable. */
export function ResourceCard({
  title,
  subtitle,
  badges,
  meta,
}: {
  title: string;
  subtitle?: React.ReactNode;
  badges?: React.ReactNode;
  meta?: readonly { label: string; value: React.ReactNode }[];
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-fg-dim" aria-hidden />
      </div>
      {badges && <div className="mt-2.5 flex flex-wrap gap-1.5">{badges}</div>}
      {meta && meta.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-hairline pt-3">
          {meta.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="font-mono text-[10px] tracking-[0.1em] text-fg-faint uppercase">
                {item.label}
              </dt>
              <dd className="mt-0.5 truncate text-[12px] text-fg-soft">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
