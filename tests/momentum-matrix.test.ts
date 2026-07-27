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
});
