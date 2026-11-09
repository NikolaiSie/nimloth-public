import { describe, expect, it } from "vitest";
import { normalizeMomentumMatrixColumns } from "@/lib/momentum-matrix";
import type { MomentumMatrixSlice, MomentumMetadata } from "@/lib/nimloth-api";

describe("normalizeMomentumMatrixColumns", () => {
  it("expands the matrix to all target horizons from metadata", () => {
    const metadata: MomentumMetadata = {
      dates: ["2026-07-23"],
      countries: ["ALL"],
      caps: ["ALL"],
      aggregations: ["mean"],
      sort_features: ["momentum_1d"],
      target_horizons: ["forward_return_1d", "forward_return_1m", "forward_return_1y"],
      latest_date: "2026-07-23",
      schema_version: "v1",
    };

    const slice: MomentumMatrixSlice = {
      schema_version: "v1",
      mode: "latest_available",
      date: "2026-07-23",
      latest_date: "2026-07-23",
      country: "ALL",
      cap: "ALL",
      aggregation: "mean",
      rows: ["momentum_1d"],
      columns: ["forward_return_1d"],
      sort_feature_families: { momentum_1d: "momentum" },
      as_of_dates: [["2026-07-23"]],
      values: [[0.12]],
      q1_values: [[0.05]],
      q5_values: [[0.17]],
      n_total: [[100]],
      n_q1: [[20]],
      n_q5: [[20]],
      min_sort_value_q1: [[-1]],
      max_sort_value_q1: [[0]],
      min_sort_value_q5: [[1]],
      max_sort_value_q5: [[2]],
    };

    const normalized = normalizeMomentumMatrixColumns(slice, metadata);

    expect(normalized.columns).toEqual([
      "forward_return_1d",
      "forward_return_1m",
      "forward_return_1y",
    ]);
    expect(normalized.as_of_dates).toEqual([["2026-07-23", null, null]]);
    expect(normalized.values).toEqual([[0.12, null, null]]);
    expect(normalized.n_total).toEqual([[100, null, null]]);
  });

  it("removes level-to-moving-average rows while keeping moving-average ratios", () => {
    const metadata: MomentumMetadata = {
      dates: ["2026-07-23"],
      countries: ["ALL"],
      caps: ["ALL"],
      aggregations: ["mean"],
      sort_features: ["momentum_1d", "level_to_ma_50d", "ma_10d_to_50d"],
      target_horizons: ["forward_return_1d"],
      latest_date: "2026-07-23",
      schema_version: "v1",
    };

    const slice: MomentumMatrixSlice = {
      schema_version: "v1",
      mode: "latest_available",
      date: "2026-07-23",
      latest_date: "2026-07-23",
      country: "ALL",
      cap: "ALL",
      aggregation: "mean",
      rows: ["momentum_1d", "level_to_ma_50d", "ma_10d_to_50d"],
      columns: ["forward_return_1d"],
      sort_feature_families: {
        momentum_1d: "momentum",
        level_to_ma_50d: "moving_average",
        ma_10d_to_50d: "moving_average",
      },
      as_of_dates: [["2026-07-23"], ["2026-07-23"], ["2026-07-23"]],
      values: [[0.12], [0.2], [0.3]],
      q1_values: [[0.05], [0.1], [0.2]],
      q5_values: [[0.17], [0.3], [0.5]],
      n_total: [[100], [90], [80]],
      n_q1: [[20], [18], [16]],
      n_q5: [[20], [18], [16]],
      min_sort_value_q1: [[-1], [10], [0.7]],
      max_sort_value_q1: [[0], [20], [0.9]],
      min_sort_value_q5: [[1], [50], [1.1]],
      max_sort_value_q5: [[2], [60], [1.3]],
    };

    const normalized = normalizeMomentumMatrixColumns(slice, metadata);

    expect(normalized.rows).toEqual(["momentum_1d", "ma_10d_to_50d"]);
    expect(normalized.values).toEqual([[0.12], [0.3]]);
    expect(normalized.n_total).toEqual([[100], [80]]);
    expect(normalized.sort_feature_families).toEqual({
      momentum_1d: "momentum",
      ma_10d_to_50d: "moving_average",
    });
  });

  it("lists the 5y ex 1y, volatility, beta and skewness rows after the moving-average ratios", () => {
    // The order the data API publishes (SORT_FEATURE_ORDER).
    const rows = [
      "momentum_5y",
      "momentum_5y_ex_1y",
      "ma_5d_to_50d",
      "ma_50d_to_200d",
      "volatility_1m",
      "beta_1y",
      "skewness_1y",
    ];
    const perRow = (offset: number) => rows.map((_, index) => [index + offset]);
    const metadata: MomentumMetadata = {
      dates: ["2026-07-23"],
      countries: ["ALL"],
      caps: ["ALL"],
      aggregations: ["mean"],
      sort_features: rows,
      target_horizons: ["forward_return_1d"],
    };
    const slice: MomentumMatrixSlice = {
      date: "2026-07-23",
      country: "ALL",
      cap: "ALL",
      aggregation: "mean",
      rows,
      columns: ["forward_return_1d"],
      sort_feature_families: {},
      as_of_dates: rows.map(() => ["2026-07-23"]),
      values: perRow(0),
      q1_values: perRow(10),
      q5_values: perRow(20),
      n_total: perRow(30),
      n_q1: perRow(40),
      n_q5: perRow(50),
      min_sort_value_q1: perRow(60),
      max_sort_value_q1: perRow(70),
      min_sort_value_q5: perRow(80),
      max_sort_value_q5: perRow(90),
    };

    const normalized = normalizeMomentumMatrixColumns(slice, metadata);
    const displayOrder = [0, 2, 3, 1, 4, 5, 6];

    expect(normalized.rows).toEqual([
      "momentum_5y",
      "ma_5d_to_50d",
      "ma_50d_to_200d",
      "momentum_5y_ex_1y",
      "volatility_1m",
      "beta_1y",
      "skewness_1y",
    ]);
    expect(normalized.values).toEqual(displayOrder.map((index) => [index]));
    expect(normalized.q1_values).toEqual(displayOrder.map((index) => [index + 10]));
    expect(normalized.q5_values).toEqual(displayOrder.map((index) => [index + 20]));
    expect(normalized.n_total).toEqual(displayOrder.map((index) => [index + 30]));
    expect(normalized.max_sort_value_q5).toEqual(displayOrder.map((index) => [index + 90]));
  });

  it("returns a slice already in display order unchanged", () => {
    const metadata: MomentumMetadata = {
      dates: [],
      countries: [],
      caps: [],
      aggregations: [],
      sort_features: [],
      target_horizons: ["forward_return_1d"],
    };
    const slice: MomentumMatrixSlice = {
      date: "2026-07-23",
      country: "ALL",
      cap: "ALL",
      aggregation: "mean",
      rows: ["momentum_1d", "ma_5d_to_50d", "skewness_1y"],
      columns: ["forward_return_1d"],
      sort_feature_families: {},
      as_of_dates: [],
      values: [[1], [2], [3]],
      q1_values: [],
      q5_values: [],
      n_total: [],
      n_q1: [],
      n_q5: [],
      min_sort_value_q1: [],
      max_sort_value_q1: [],
      min_sort_value_q5: [],
      max_sort_value_q5: [],
    };

    expect(normalizeMomentumMatrixColumns(slice, metadata)).toBe(slice);
  });
});
