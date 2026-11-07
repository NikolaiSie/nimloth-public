export const MOMENTUM_AGGREGATIONS = ["mean", "median", "weighted_mean"] as const;

export type MomentumAggregation = (typeof MOMENTUM_AGGREGATIONS)[number];
