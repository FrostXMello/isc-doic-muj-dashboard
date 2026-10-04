import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ClickableRow } from "@/components/internal/ui/clickable-row";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
};

/**
 * Responsive record list: a table from the `md` breakpoint up, stacked cards
 * below it. The first column links to the record and the rest of the row opens
 * it too; links and buttons inside cells keep their own behaviour.
 *
 * Card content is wrapped in the record link, so it must not contain links or
 * buttons. Put those in `renderCardActions`, which renders outside the link.
 */
export function ResourceTable<T>({
  rows,
  columns,
  getKey,
  getHref,
  getRowLabel,
  renderCard,
  renderCardActions,
  caption,
  empty,
}: {
  rows: readonly T[];
  columns: readonly Column<T>[];
  getKey: (row: T) => string;
  getHref: (row: T) => string;
  getRowLabel: (row: T) => string;
  renderCard: (row: T) => React.ReactNode;
  renderCardActions?: (row: T) => React.ReactNode;
  caption: string;
  empty: React.ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="portal-surface">{empty}</div>;
  }

  return (
    <div className="dash-rise" style={{ animationDelay: "160ms" }}>
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-line-strong">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "px-4 pt-2 pb-3 text-[11px] font-medium tracking-[0.14em] whitespace-nowrap text-fg-faint uppercase first:pl-4",
                      column.headerClassName,
                    )}
                  >
                    {column.header}
                  </th>
                ))}
                <th scope="col" className="w-10 px-4 pb-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rows.map((row) => (
                <ClickableRow
                  key={getKey(row)}
                  href={getHref(row)}
                  className="group cursor-pointer transition-colors hover:bg-overlay focus-within:bg-overlay motion-reduce:transition-none"
                >
                  {columns.map((column, index) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-4 align-middle text-[13px] text-fg-soft first:pl-4",
                        index === 0 &&
                          "transition-shadow group-focus-within:shadow-[inset_3px_0_0_0_var(--muj)] group-hover:shadow-[inset_3px_0_0_0_var(--muj)] motion-reduce:transition-none",
                        column.className,
                      )}
                    >
                      {index === 0 ? (
                        <Link
                          href={getHref(row)}
                          className="rounded-sm text-[14px] text-foreground outline-offset-2 transition-colors group-hover:text-muj-fg"
                        >
                          {column.cell(row)}
                        </Link>
                      ) : (
                        column.cell(row)
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right">
                    <ChevronRight
                      className="ml-auto size-4 text-fg-dim transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-muj-fg motion-reduce:transition-none"
                      aria-hidden
                    />
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ul className="divide-y divide-hairline border-y border-hairline md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const actions = renderCardActions?.(row);
          return (
            <li key={getKey(row)} className="portal-row-marker">
              <Link
                href={getHref(row)}
                aria-label={getRowLabel(row)}
                className="block px-3 py-4 transition-colors hover:bg-overlay"
              >
                {renderCard(row)}
              </Link>
              {actions ? (
                <div className="flex flex-wrap items-center gap-2 px-3 pb-4">{actions}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
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
          <p className="text-[15px] leading-snug font-medium text-foreground">{title}</p>
          {subtitle && <p className="mt-1 text-[12px] text-muted-foreground">{subtitle}</p>}
        </div>
        <ChevronRight className="mt-0.5 size-4 shrink-0 text-muj-fg" aria-hidden />
      </div>
      {badges && <div className="mt-3 flex flex-wrap gap-1.5">{badges}</div>}
      {meta && meta.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          {meta.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-[10px] font-medium tracking-[0.14em] text-fg-faint uppercase">
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
