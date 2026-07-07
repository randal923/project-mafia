import type { ReactNode } from "react";

type TableAlignment = "left" | "right";
type TableDensity = "comfortable" | "compact";
type TableCellTone = "neutral" | "muted" | "profit" | "danger";

type TableColumn = {
  align?: TableAlignment;
  header: string;
  id: string;
  isRowHeader?: boolean;
};

type TableCell = {
  detail?: string;
  tone?: TableCellTone;
  value: ReactNode;
};

type TableRow = {
  cells: readonly TableCell[];
  id: string;
};

type TableProps = {
  caption: string;
  className?: string;
  columns: readonly TableColumn[];
  density?: TableDensity;
  description?: string;
  emptyMessage?: string;
  rows: readonly TableRow[];
};

const alignmentClasses: Record<TableAlignment, string> = {
  left: "text-left",
  right: "text-right"
};

const densityClasses: Record<TableDensity, string> = {
  comfortable: "py-4",
  compact: "py-3"
};

const toneClasses: Record<TableCellTone, string> = {
  danger: "text-danger-strong",
  muted: "text-muted",
  neutral: "text-ink",
  profit: "text-profit"
};

export function Table({
  caption,
  className,
  columns,
  density = "comfortable",
  description,
  emptyMessage = "No records available.",
  rows
}: TableProps) {
  const classNames = [
    "overflow-x-auto rounded-panel border border-line bg-surface shadow-panel",
    className
  ]
    .filter(Boolean)
    .join(" ");
  const hasColumns = columns.length > 0;
  const shouldShowEmptyState = !hasColumns || rows.length === 0;
  const emptyStateMessage = hasColumns ? emptyMessage : "No columns available.";

  return (
    <div className={classNames}>
      <table className="min-w-full border-collapse">
        <caption className="caption-top border-b border-line bg-surface-raised px-4 py-4 text-left">
          <span className="block font-display text-3xl uppercase leading-none tracking-normal text-title">
            {caption}
          </span>
          {description ? (
            <span className="mt-2 block text-base leading-relaxed text-muted">
              {description}
            </span>
          ) : null}
        </caption>
        {hasColumns ? (
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className={`border-b border-line bg-black/40 px-4 py-3 font-display text-xl uppercase leading-none tracking-normal text-brass ${alignmentClasses[column.align ?? "left"]}`}
                  key={column.id}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {shouldShowEmptyState ? (
            <tr>
              <td
                className="px-4 py-6 text-center text-base leading-relaxed text-muted"
                colSpan={Math.max(columns.length, 1)}
              >
                {emptyStateMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr className="transition-colors hover:bg-brass/5" key={row.id}>
                {columns.map((column, index) => {
                  const cell = row.cells[index];
                  const cellContent = cell ? (
                    <>
                      <span className="block">{cell.value}</span>
                      {cell.detail ? (
                        <span className="mt-1 block text-sm leading-relaxed text-muted">
                          {cell.detail}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-faint">-</span>
                  );

                  if (column.isRowHeader) {
                    return (
                      <th
                        className={`border-b border-line px-4 align-top text-base font-medium leading-relaxed ${alignmentClasses[column.align ?? "left"]} ${densityClasses[density]} ${toneClasses[cell?.tone ?? "neutral"]}`}
                        key={column.id}
                        scope="row"
                      >
                        {cellContent}
                      </th>
                    );
                  }

                  return (
                    <td
                      className={`border-b border-line px-4 align-top text-base leading-relaxed ${alignmentClasses[column.align ?? "left"]} ${densityClasses[density]} ${toneClasses[cell?.tone ?? "neutral"]}`}
                      key={column.id}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
