import type { MomentumMatrixSlice } from "@/lib/nimloth-api";

export type HeatmapCell = {
  rowLabel: string;
  columnLabel: string;
  value: number | null;
};

export function buildHeatmapCells(slice: MomentumMatrixSlice) {
  const cells: HeatmapCell[] = [];

  for (const [rowIndex, rowLabel] of slice.rows.entries()) {
    const rowValues = slice.values[rowIndex] ?? [];

    for (const [columnIndex, columnLabel] of slice.columns.entries()) {
      cells.push({
        rowLabel,
        columnLabel,
        value: rowValues[columnIndex] ?? null,
      });
    }
  }

  return cells;
}

export function getMaxAbsoluteValue(values: MomentumMatrixSlice["values"]) {
  let max = 0;

  for (const row of values) {
    for (const value of row) {
      if (typeof value !== "number" || Number.isNaN(value)) {
        continue;
      }

      max = Math.max(max, Math.abs(value));
    }
  }

  return max;
}

export function getHeatmapCellStyle(value: number | null, maxAbsoluteValue: number) {
  if (value === null || Number.isNaN(value)) {
    return {
      backgroundColor: "rgba(22, 34, 31, 0.08)",
      color: "var(--muted)",
    };
  }

  const safeMax = maxAbsoluteValue > 0 ? maxAbsoluteValue : 1;
  const intensity = Math.min(Math.abs(value) / safeMax, 1);

  if (value >= 0) {
    return {
      backgroundColor: `rgba(15, 91, 83, ${0.16 + intensity * 0.52})`,
      color: intensity > 0.5 ? "var(--surface-strong)" : "var(--accent-strong)",
    };
  }

  return {
    backgroundColor: `rgba(197, 138, 51, ${0.16 + intensity * 0.52})`,
    color: intensity > 0.55 ? "#2c1908" : "var(--accent-strong)",
  };
}

export function formatHeatmapValue(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(4);
}
