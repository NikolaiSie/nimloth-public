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

export function normalizeMomentumMatrixColumns(
  slice: MomentumMatrixSlice,
  metadata: MomentumMetadata,
) {
  const targetColumns =
    metadata.target_horizons.length > 0 ? metadata.target_horizons : slice.columns;

  if (
    targetColumns.length === slice.columns.length &&
    targetColumns.every((column, index) => column === slice.columns[index])
  ) {
    return slice;
  }

  return {
    ...slice,
    columns: targetColumns,
    as_of_dates: slice.as_of_dates.map((row) =>
      expandStringRow(row, slice.columns, targetColumns),
    ),
    values: slice.values.map((row) => expandRow(row, slice.columns, targetColumns)),
    q1_values: slice.q1_values.map((row) =>
      expandRow(row, slice.columns, targetColumns),
    ),
    q5_values: slice.q5_values.map((row) =>
      expandRow(row, slice.columns, targetColumns),
    ),
    n_total: slice.n_total.map((row) => expandRow(row, slice.columns, targetColumns)),
    n_q1: slice.n_q1.map((row) => expandRow(row, slice.columns, targetColumns)),
    n_q5: slice.n_q5.map((row) => expandRow(row, slice.columns, targetColumns)),
    min_sort_value_q1: slice.min_sort_value_q1.map((row) =>
      expandRow(row, slice.columns, targetColumns),
    ),
    max_sort_value_q1: slice.max_sort_value_q1.map((row) =>
      expandRow(row, slice.columns, targetColumns),
    ),
    min_sort_value_q5: slice.min_sort_value_q5.map((row) =>
      expandRow(row, slice.columns, targetColumns),
    ),
    max_sort_value_q5: slice.max_sort_value_q5.map((row) =>
      expandRow(row, slice.columns, targetColumns),
    ),
  };
}
