"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  MOMENTUM_AGGREGATIONS,
  type MomentumAggregation,
} from "@/lib/momentum-aggregations";
import type { MomentumMatrixSlice, MomentumMetadata } from "@/lib/nimloth-api";
import {
  formatHeatmapValue,
  getHeatmapCellStyle,
  getMaxAbsoluteValue,
} from "@/lib/momentum-heatmap";
import { marketOptions } from "@/lib/momentum-cumulative";

export type MomentumOverviewPayload = {
  metadata: MomentumMetadata;
  matrix: MomentumMatrixSlice;
  filters: {
    country: string;
    cap: "ALL" | "SC" | "MC" | "LC";
    aggregation: MomentumAggregation;
    date: string | null;
  };
};

type ActiveCell = {
  row: number;
  column: number;
  /** Position and width in px, relative to the heatmap frame. */
  left: number;
  top: number;
  width: number;
  /** Shown below the cell instead of above it. */
  below: boolean;
};

const TOOLTIP_WIDTH = 208;
const TOOLTIP_MARGIN = 8;
const TOOLTIP_GAP = 10;
/** Title plus seven lines; used only to decide whether it fits above the cell. */
const TOOLTIP_ESTIMATED_HEIGHT = 180;

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
  >(initialPayload?.filters.aggregation ?? "weighted_mean");

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
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  // A new matrix closes the tooltip; adjusted during render rather than in an effect.
  const [tooltipMatrix, setTooltipMatrix] = useState(matrix);
  if (tooltipMatrix !== matrix) {
    setTooltipMatrix(matrix);
    setActiveCell(null);
  }
  const activeCellElement = useRef<HTMLElement | null>(null);
  const tooltipId = useId();

  /**
   * Places the tooltip over the cell, kept inside the heatmap's width. It sits
   * outside the scrolling grid, so neither the scroller nor the pinned metric
   * column can clip it; it opens below the cell when there is no room above.
   */
  function showTooltip(row: number, column: number, cell: HTMLElement) {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const frameBox = frame.getBoundingClientRect();
    const cellBox = cell.getBoundingClientRect();
    const cardTop =
      frame.closest(".research-overview")?.getBoundingClientRect().top ?? frameBox.top;
    const width = Math.min(TOOLTIP_WIDTH, frameBox.width - 2 * TOOLTIP_MARGIN);
    const center = cellBox.left + cellBox.width / 2 - frameBox.left;
    const roomAbove = Math.min(cellBox.top, cellBox.top - cardTop);
    const below = roomAbove < TOOLTIP_ESTIMATED_HEIGHT + TOOLTIP_GAP;

    activeCellElement.current = cell;
    setActiveCell({
      row,
      column,
      below,
      width,
      left: Math.min(
        Math.max(center - width / 2, TOOLTIP_MARGIN),
        frameBox.width - width - TOOLTIP_MARGIN,
      ),
      top: below
        ? cellBox.bottom - frameBox.top + TOOLTIP_GAP
        : cellBox.top - frameBox.top - TOOLTIP_GAP,
    });
  }

  function hideTooltip() {
    activeCellElement.current = null;
    setActiveCell(null);
  }

  /** Sideways scrolling, including the browser bringing a tapped edge cell into view, moves the tooltip with its cell. */
  function followActiveCell() {
    const cell = activeCellElement.current;
    if (cell && activeCell) {
      showTooltip(activeCell.row, activeCell.column, cell);
    }
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        dateMenuRef.current &&
        event.target instanceof Node &&
        !dateMenuRef.current.contains(event.target)
      ) {
        setIsDateMenuOpen(false);
      }
      // A tap outside the cells closes the tooltip, even where taps don't move focus.
      if (!(event.target instanceof Element && event.target.closest(".heatmap-cell"))) {
        setActiveCell(null);
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
            <h2>Momentum heatmap</h2>
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
              {marketOptions(metadata?.countries ?? ["ALL"], metadata?.country_names ?? {}).map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
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
              {(metadata?.aggregations ?? MOMENTUM_AGGREGATIONS).map((option) => (
                <option key={option} value={option}>
                  {option.replace(/_/g, " ")}
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
          <div className="heatmap-frame" ref={frameRef}>
            <div className="heatmap-shell" onScroll={followActiveCell}>
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
                      const isActive =
                        activeCell?.row === rowIndex && activeCell.column === columnIndex;
                      return (
                        <div
                          aria-describedby={isActive ? tooltipId : undefined}
                          className={`heatmap-cell${isActive ? " heatmap-cell--active" : ""}`}
                          key={`${rowLabel}-${columnLabel}`}
                          style={getHeatmapCellStyle(value, maxAbsoluteValue)}
                          tabIndex={0}
                          onBlur={hideTooltip}
                          onFocus={(event) =>
                            showTooltip(rowIndex, columnIndex, event.currentTarget)
                          }
                          onPointerEnter={(event) =>
                            showTooltip(rowIndex, columnIndex, event.currentTarget)
                          }
                          onPointerLeave={(event) => {
                            // A finger lifting also "leaves"; keep the card open after a tap.
                            if (event.pointerType === "mouse") {
                              hideTooltip();
                            }
                          }}
                        >
                          <span>{formatHeatmapValue(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {activeCell && matrix.rows[activeCell.row] && matrix.columns[activeCell.column] ? (
              <div
                className={`heatmap-tooltip${activeCell.below ? " heatmap-tooltip--below" : ""}`}
                id={tooltipId}
                role="tooltip"
                style={{ left: activeCell.left, top: activeCell.top, width: activeCell.width }}
              >
                {(() => {
                  const { row, column } = activeCell;
                  const value = matrix.values[row]?.[column] ?? null;
                  return (
                    <>
                      <p className="heatmap-tooltip__title">
                        {formatFeatureLabel(matrix.rows[row])} vs{" "}
                        {formatHorizonLabel(matrix.columns[column])}
                      </p>
                      <p>As of: {formatCellAsOf(matrix.as_of_dates[row]?.[column] ?? null)}</p>
                      <p>Spread: {formatHeatmapValue(value)}</p>
                      <p>Q1: {formatHeatmapValue(matrix.q1_values[row]?.[column] ?? null)}</p>
                      <p>Q5: {formatHeatmapValue(matrix.q5_values[row]?.[column] ?? null)}</p>
                      <p>N obs: {formatObservationCount(matrix.n_total[row]?.[column] ?? null)}</p>
                      <p>Q1 obs: {formatObservationCount(matrix.n_q1[row]?.[column] ?? null)}</p>
                      <p>Q5 obs: {formatObservationCount(matrix.n_q5[row]?.[column] ?? null)}</p>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
