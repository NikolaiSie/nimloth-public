import { describe, expect, it } from "vitest";
import type { MomentumMatrixSlice } from "@/lib/nimloth-api";
import {
  buildHeatmapCells,
  formatHeatmapValue,
  getHeatmapCellStyle,
  getMaxAbsoluteValue,
} from "@/lib/momentum-heatmap";

const slice: MomentumMatrixSlice = {
  date: "2026-07-23",
  country: "ALL",
  cap: "ALL",
  aggregation: "mean",
  rows: ["momentum_1d", "momentum_1m"],
  columns: ["forward_return_1d", "forward_return_1m"],
  as_of_dates: [
    ["2026-07-23", "2026-07-23"],
    [null, "2026-07-23"],
  ],
  values: [
    [0.15, -0.2],
    [null, 0.05],
  ],
  q1_values: [],
  q5_values: [],
  n_total: [],
  n_q1: [],
  n_q5: [],
  min_sort_value_q1: [],
  max_sort_value_q1: [],
  min_sort_value_q5: [],
  max_sort_value_q5: [],
  sort_feature_families: {},
};

describe("momentum heatmap helpers", () => {
  it("flattens matrix values into heatmap cells", () => {
    expect(buildHeatmapCells(slice)).toEqual([
      {
        rowLabel: "momentum_1d",
        columnLabel: "forward_return_1d",
        value: 0.15,
      },
      {
        rowLabel: "momentum_1d",
        columnLabel: "forward_return_1m",
        value: -0.2,
      },
      {
        rowLabel: "momentum_1m",
        columnLabel: "forward_return_1d",
        value: null,
      },
      {
        rowLabel: "momentum_1m",
        columnLabel: "forward_return_1m",
        value: 0.05,
      },
    ]);
  });

  it("finds the largest absolute value in the matrix", () => {
    expect(getMaxAbsoluteValue(slice.values)).toBe(0.2);
  });

  it("formats cells and missing values for display", () => {
    expect(formatHeatmapValue(0.123456)).toBe("0.1235");
    expect(formatHeatmapValue(null)).toBe("N/A");
  });

  it("returns distinct styles for positive, negative, and missing values", () => {
    expect(getHeatmapCellStyle(0.15, 0.2).backgroundColor).toContain(
      "rgba(15, 91, 83",
    );
    expect(getHeatmapCellStyle(-0.2, 0.2).backgroundColor).toContain(
      "rgba(197, 138, 51",
    );
    expect(getHeatmapCellStyle(null, 0.2).backgroundColor).toBe(
      "rgba(22, 34, 31, 0.08)",
    );
  });
});
