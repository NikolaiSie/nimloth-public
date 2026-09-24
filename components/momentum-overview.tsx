"use client";

import { useEffect, useRef, useState } from "react";
import type { MomentumMatrixSlice, MomentumMetadata } from "@/lib/nimloth-api";
import {
  formatHeatmapValue,
  getHeatmapCellStyle,
  getMaxAbsoluteValue,
} from "@/lib/momentum-heatmap";

export type MomentumOverviewPayload = {
  metadata: MomentumMetadata;
  matrix: MomentumMatrixSlice;
  filters: {
    country: string;
    cap: "ALL" | "SC" | "MC" | "LC";
    aggregation: "mean" | "median";
    date: string | null;
  };
};

type MomentumOverviewProps = {
  initialPayload: MomentumOverviewPayload | null;
  initialError?: string | null;
};

export function MomentumOverview({
  initialPayload,
  initialError = null,
}: MomentumOverviewProps) {
  const initialDateSelection = initialPayload?.filters.date ?? "LATEST";
  const [payload, setPayload] = useState<MomentumOverviewPayload | null>(initialPayload);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [date, setDate] = useState(initialDateSelection);
  const [country, setCountry] = useState(initialPayload?.filters.country ?? "ALL");
  const [cap, setCap] = useState<MomentumOverviewPayload["filters"]["cap"]>(
    initialPayload?.filters.cap ?? "ALL",
  );
  const [aggregation, setAggregation] = useState<
    MomentumOverviewPayload["filters"]["aggregation"]
  >(initialPayload?.filters.aggregation ?? "median");

  useEffect(() => {
    let ignore = false;

    async function loadPayload() {
      setIsLoading(true);
      setErrorMessage(null);

      const params = new URLSearchParams({
        country,
        cap,
        aggregation,
      });

      if (date !== "LATEST") {
        params.set("date", date);
      }

      try {
        const response = await fetch(`/api/research/momentum?${params.toString()}`, {
          cache: "no-store",
        });

        const data = (await response.json()) as
          | MomentumOverviewPayload
          | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in data && typeof data.message === "string"
              ? data.message
              : "Momentum data could not be loaded.",
          );
        }

        if (!ignore) {
          setPayload(data as MomentumOverviewPayload);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Momentum data could not be loaded.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    const unchanged =
      initialPayload &&
      date === initialDateSelection &&
      country === initialPayload.filters.country &&
      cap === initialPayload.filters.cap &&
      aggregation === initialPayload.filters.aggregation;

    if (unchanged) {
      return () => {
        ignore = true;
      };
    }

    void loadPayload();

    return () => {
      ignore = true;
    };
  }, [aggregation, cap, country, date, initialDateSelection, initialPayload]);

  const matrix = payload?.matrix ?? null;
  const metadata = payload?.metadata ?? null;
  const maxAbsoluteValue = matrix ? getMaxAbsoluteValue(matrix.values) : 0;
  const dateMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        dateMenuRef.current &&
        event.target instanceof Node &&
        !dateMenuRef.current.contains(event.target)
      ) {
        setIsDateMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function formatHorizonLabel(value: string) {
    return value
      .replace("forward_return_", "")
      .replace("momentum_", "")
      .replace("level_to_ma_", "lvl/ma ")
      .replace("ma_", "ma ")
      .replaceAll("_", " ")
      .replace("12m ex 1m", "12m ex 1m")
      .toUpperCase();
  }

  function formatFeatureLabel(value: string) {
    return value
      .replace("momentum_", "")
      .replace("level_to_ma_", "lvl/ma ")
      .replace("ma_", "ma ")
      .replaceAll("_", " ");
  }

  function formatDateLabel(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatCellAsOf(value: string | null) {
    if (!value) {
      return "N/A";
    }

    return formatDateLabel(value);
  }

  function formatObservationCount(value: number | null) {
    if (value === null || Number.isNaN(value)) {
      return "N/A";
    }

    return new Intl.NumberFormat("en-US").format(value);
  }

  const dateOptions = [
    { label: "Latest", value: "LATEST" },
    ...[...(metadata?.dates ?? [])]
      .slice()
      .reverse()
      .map((option) => ({
        label: formatDateLabel(option),
        value: option,
      })),
  ];
  const selectedDateLabel =
    dateOptions.find((option) => option.value === date)?.label ?? "Latest";

  return (
    <section className="section" id="momentum">
      <div className="research-overview card">
        <div className="research-overview__header">
          <div>
            <h2>Global stock momentum snapshot</h2>
          </div>
          <div className="research-overview__meta">
            {matrix ? (
              <span className="tag">
                {matrix.mode === "latest_available"
                  ? `Latest through ${matrix.latest_date ?? "N/A"}`
                  : `Date ${matrix.date ?? "N/A"}`}
              </span>
            ) : null}
          </div>
        </div>

        <div className="research-filters">
          <div className="research-filter research-filter--date" ref={dateMenuRef}>
            <span>Date</span>
            <button
              aria-expanded={isDateMenuOpen}
              className="date-menu__button"
              type="button"
              onClick={() => setIsDateMenuOpen((isOpen) => !isOpen)}
            >
              {selectedDateLabel}
            </button>
            {isDateMenuOpen ? (
              <div className="date-menu__list" role="listbox">
                {dateOptions.map((option) => (
                  <button
                    aria-selected={option.value === date}
                    className="date-menu__option"
                    key={option.value}
                    role="option"
                    type="button"
                    onClick={() => {
                      setDate(option.value);
                      setIsDateMenuOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="research-filter">
            <span>Country</span>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              {(metadata?.countries ?? ["ALL"]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Cap bucket</span>
            <select
              value={cap}
              onChange={(event) =>
                setCap(event.target.value as MomentumOverviewPayload["filters"]["cap"])
              }
            >
              {(metadata?.caps ?? ["ALL", "SC", "MC", "LC"]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Aggregation</span>
            <select
              value={aggregation}
              onChange={(event) =>
                setAggregation(
                  event.target.value as MomentumOverviewPayload["filters"]["aggregation"],
                )
              }
            >
              {(metadata?.aggregations ?? ["mean", "median"]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {errorMessage ? (
          <div className="research-error">
            <h3>Momentum data unavailable</h3>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {matrix ? (
          <>
            <div className="heatmap-shell">
              <div className="heatmap-grid">
                <div
                  className="heatmap-corner"
                  aria-label="Columns are forward periods. Rows are momentum metrics."
                >
                  <span>Fwd periods -&gt;</span>
                  <span>Momentum metrics v</span>
                </div>
                {matrix.columns.map((column) => (
                  <div className="heatmap-column-label" key={column} title={column}>
                    {formatHorizonLabel(column)}
                  </div>
                ))}

                {matrix.rows.map((rowLabel, rowIndex) => (
                  <div className="heatmap-row" key={rowLabel}>
                    <div className="heatmap-row-label" title={rowLabel}>
                      {formatFeatureLabel(rowLabel)}
                    </div>
                    {matrix.columns.map((columnLabel, columnIndex) => {
                      const value = matrix.values[rowIndex]?.[columnIndex] ?? null;
                      const asOfDate =
                        matrix.as_of_dates[rowIndex]?.[columnIndex] ?? null;
                      const q1Value = matrix.q1_values[rowIndex]?.[columnIndex] ?? null;
                      const q5Value = matrix.q5_values[rowIndex]?.[columnIndex] ?? null;
                      const nTotal = matrix.n_total[rowIndex]?.[columnIndex] ?? null;
                      const nQ1 = matrix.n_q1[rowIndex]?.[columnIndex] ?? null;
                      const nQ5 = matrix.n_q5[rowIndex]?.[columnIndex] ?? null;
                      return (
                        <div
                          className="heatmap-cell"
                          key={`${rowLabel}-${columnLabel}`}
                          style={getHeatmapCellStyle(value, maxAbsoluteValue)}
                        >
                          <span>{formatHeatmapValue(value)}</span>
                          <div className="heatmap-tooltip">
                            <p className="heatmap-tooltip__title">
                              {formatFeatureLabel(rowLabel)} vs{" "}
                              {formatHorizonLabel(columnLabel)}
                            </p>
                            <p>As of: {formatCellAsOf(asOfDate)}</p>
                            <p>Spread: {formatHeatmapValue(value)}</p>
                            <p>Q1: {formatHeatmapValue(q1Value)}</p>
                            <p>Q5: {formatHeatmapValue(q5Value)}</p>
                            <p>N obs: {formatObservationCount(nTotal)}</p>
                            <p>Q1 obs: {formatObservationCount(nQ1)}</p>
                            <p>Q5 obs: {formatObservationCount(nQ5)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="research-overview__footer">
              <p>
                Showing {matrix.rows.length} sort features across{" "}
                {matrix.columns.length} target horizons for{" "}
                {matrix.country} / {matrix.cap} / {matrix.aggregation}.
              </p>
              <p>
                Horizons not yet returned by the upstream API are shown as unavailable.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
