"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toneTextClasses } from "../../design-system/tones";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";

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

const toneTokens: Record<TableCellTone, "danger" | "ink" | "muted" | "profit"> =
  {
    danger: "danger",
    muted: "muted",
    neutral: "ink",
    profit: "profit"
  };

export function Table({
  caption,
  className,
  columns,
  density = "comfortable",
  description,
  emptyMessage,
  rows
}: TableProps) {
  const t = useTranslations("common");
  const classNames = cx(
    "overflow-x-auto rounded-panel border border-line bg-surface shadow-panel",
    className
  );
  const hasColumns = columns.length > 0;
  const shouldShowEmptyState = !hasColumns || rows.length === 0;
  const emptyStateMessage = hasColumns
    ? (emptyMessage ?? t("noRecords"))
    : t("noColumns");

  return (
    <div className={classNames}>
      <table className="min-w-full border-collapse">
        <caption className="caption-top border-b border-line bg-surface-raised px-4 py-4 text-left">
          <span className={`block ${typography.panelHeading}`}>{caption}</span>
          {description ? (
            <span className={`mt-2 block ${typography.paragraph}`}>
              {description}
            </span>
          ) : null}
        </caption>
        {hasColumns ? (
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  className={`border-b border-line bg-black/40 px-4 py-3 ${displayText} text-xl text-brass ${alignmentClasses[column.align ?? "left"]}`}
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
                className={`px-4 py-6 text-center ${typography.paragraph}`}
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
                  const cellClasses = cx(
                    "border-b border-line px-4 align-top text-base leading-relaxed",
                    alignmentClasses[column.align ?? "left"],
                    densityClasses[density],
                    toneTextClasses[toneTokens[cell?.tone ?? "neutral"]]
                  );
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
                        className={cx(cellClasses, "font-medium")}
                        key={column.id}
                        scope="row"
                      >
                        {cellContent}
                      </th>
                    );
                  }

                  return (
                    <td className={cellClasses} key={column.id}>
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
