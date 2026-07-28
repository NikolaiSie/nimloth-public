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
      backgroundColor: "rgba(12, 35, 52, 0.07)",
      color: "var(--muted)",
    };
  }

  const safeMax = maxAbsoluteValue > 0 ? maxAbsoluteValue : 1;
  const intensity = Math.min(Math.abs(value) / safeMax, 1);

  if (value >= 0) {
    return {
      backgroundColor: `rgba(31, 104, 119, ${0.14 + intensity * 0.66})`,
      color: intensity > 0.46 ? "#f5f0e6" : "var(--navy)",
    };
  }

  return {
    backgroundColor: `rgba(177, 119, 66, ${0.14 + intensity * 0.64})`,
    color: intensity > 0.5 ? "#fff7e7" : "var(--navy)",
  };
}

export function formatHeatmapValue(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${(value * 100).toFixed(2)}%`;
}
