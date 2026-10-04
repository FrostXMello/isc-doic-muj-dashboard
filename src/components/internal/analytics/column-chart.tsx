export type ColumnDatum = {
  label: string;
  total: number;
  /** Part of `total` drawn in the highlight colour, e.g. completed activities. */
  part: number;
};

/**
 * Vertical columns for counts over time. The bars are decorative for screen
 * readers; the same figures are exposed as a table.
 */
export function ColumnChart({
  caption,
  data,
  partLabel,
  restLabel,
}: {
  caption: string;
  data: readonly ColumnDatum[];
  partLabel: string;
  restLabel: string;
}) {
  const max = Math.max(1, ...data.map((row) => row.total));
  return (
    <div className="px-5 py-4">
      <div aria-hidden className="flex h-40 items-end gap-2 border-b border-line sm:gap-3">
        {data.map((row) => (
          <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[11px] text-fg-soft tabular-nums">{row.total}</span>
            <div
              className="flex w-full max-w-12 flex-col-reverse overflow-hidden rounded-t-md bg-overlay"
              style={{ height: `${(row.total / max) * 100}%` }}
            >
              <div className="bg-glow/70" style={{ height: row.total ? `${(row.part / row.total) * 100}%` : 0 }} />
              <div className="flex-1 bg-muted-foreground/40" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-1.5 flex gap-2 sm:gap-3">
        {data.map((row) => (
          <span key={row.label} className="min-w-0 flex-1 text-center text-[11px] text-muted-foreground tabular-nums">
            {row.label}
          </span>
        ))}
      </div>
      <ul aria-hidden className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-glow/70" />
          {partLabel}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-muted-foreground/40" />
          {restLabel}
        </li>
      </ul>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Total</th>
            <th scope="col">{partLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.total}</td>
              <td>{row.part}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
