import type { MomentumMatrixSlice, MomentumMetadata } from "@/lib/nimloth-api";

function expandRow(
  row: Array<number | null> | undefined,
  sourceColumns: string[],
  targetColumns: string[],
) {
  const byColumn = new Map<string, number | null>();

  for (const [index, column] of sourceColumns.entries()) {
    byColumn.set(column, row?.[index] ?? null);
  }

  return targetColumns.map((column) => byColumn.get(column) ?? null);
}

function expandStringRow(
  row: Array<string | null> | undefined,
  sourceColumns: string[],
  targetColumns: string[],
) {
  const byColumn = new Map<string, string | null>();

  for (const [index, column] of sourceColumns.entries()) {
    byColumn.set(column, row?.[index] ?? null);
  }

  return targetColumns.map((column) => byColumn.get(column) ?? null);
}

function isLevelToMovingAverageFeature(rowLabel: string) {
  const normalized = rowLabel.toLowerCase();

  return normalized.startsWith("level_to_ma_");
}

function filterRows<T>(rows: T[], rowIndexes: number[]) {
  return rowIndexes.map((rowIndex) => rows[rowIndex]);
}

export function normalizeMomentumMatrixColumns(
  slice: MomentumMatrixSlice,
  metadata: MomentumMetadata,
) {
  const targetColumns =
    metadata.target_horizons.length > 0 ? metadata.target_horizons : slice.columns;
  const rowIndexesToKeep = slice.rows
    .map((rowLabel, rowIndex) =>
      isLevelToMovingAverageFeature(rowLabel) ? null : rowIndex,
    )
    .filter((rowIndex): rowIndex is number => rowIndex !== null);
  const hasFilteredRows = rowIndexesToKeep.length !== slice.rows.length;
  const filteredSlice = hasFilteredRows
    ? {
        ...slice,
        rows: filterRows(slice.rows, rowIndexesToKeep),
        sort_feature_families: Object.fromEntries(
          Object.entries(slice.sort_feature_families).filter(([rowLabel]) =>
            rowIndexesToKeep.some((rowIndex) => slice.rows[rowIndex] === rowLabel),
          ),
        ),
        as_of_dates: filterRows(slice.as_of_dates, rowIndexesToKeep),
        values: filterRows(slice.values, rowIndexesToKeep),
        q1_values: filterRows(slice.q1_values, rowIndexesToKeep),
        q5_values: filterRows(slice.q5_values, rowIndexesToKeep),
        n_total: filterRows(slice.n_total, rowIndexesToKeep),
        n_q1: filterRows(slice.n_q1, rowIndexesToKeep),
        n_q5: filterRows(slice.n_q5, rowIndexesToKeep),
        min_sort_value_q1: filterRows(slice.min_sort_value_q1, rowIndexesToKeep),
        max_sort_value_q1: filterRows(slice.max_sort_value_q1, rowIndexesToKeep),
        min_sort_value_q5: filterRows(slice.min_sort_value_q5, rowIndexesToKeep),
        max_sort_value_q5: filterRows(slice.max_sort_value_q5, rowIndexesToKeep),
      }
    : slice;

  if (
    !hasFilteredRows &&
    targetColumns.length === filteredSlice.columns.length &&
    targetColumns.every((column, index) => column === filteredSlice.columns[index])
  ) {
    return filteredSlice;
  }

  return {
    ...filteredSlice,
    columns: targetColumns,
    as_of_dates: filteredSlice.as_of_dates.map((row) =>
      expandStringRow(row, filteredSlice.columns, targetColumns),
    ),
    values: filteredSlice.values.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    q1_values: filteredSlice.q1_values.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    q5_values: filteredSlice.q5_values.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    n_total: filteredSlice.n_total.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    n_q1: filteredSlice.n_q1.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    n_q5: filteredSlice.n_q5.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    min_sort_value_q1: filteredSlice.min_sort_value_q1.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    max_sort_value_q1: filteredSlice.max_sort_value_q1.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    min_sort_value_q5: filteredSlice.min_sort_value_q5.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
    max_sort_value_q5: filteredSlice.max_sort_value_q5.map((row) =>
      expandRow(row, filteredSlice.columns, targetColumns),
    ),
  };
}
