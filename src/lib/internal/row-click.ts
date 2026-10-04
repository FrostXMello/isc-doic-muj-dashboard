/** Elements that handle their own clicks; a click on or inside one never opens the row. */
export const ROW_INTERACTIVE_SELECTOR =
  "a[href], button, input, select, textarea, label, summary, details, dialog, [role='button'], [role='link'], [contenteditable='true']";

/** The DOM surface used here, so the decision can be unit-tested without a browser. */
export type RowNode<N> = { closest(selector: string): N | null; contains(other: N): boolean };

export function shouldOpenRow<N extends RowNode<N>>({
  button,
  defaultPrevented,
  modifier,
  target,
  row,
  selection,
}: {
  button: number;
  defaultPrevented: boolean;
  modifier: boolean;
  target: N | null;
  row: N;
  selection: string;
}): "navigate" | "new-tab" | "ignore" {
  if (defaultPrevented || button !== 0) return "ignore";
  const interactive = target?.closest(ROW_INTERACTIVE_SELECTOR);
  // Only controls inside the row count; the row itself may sit inside e.g. a <details>.
  if (interactive && interactive !== row && row.contains(interactive)) return "ignore";
  if (selection.trim()) return "ignore";
  return modifier ? "new-tab" : "navigate";
}
