"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MOMENTUM_AGGREGATIONS, type MomentumAggregation } from "@/lib/momentum-aggregations";
import {
  CUMULATIVE_DEFAULT_SIGNAL,
  CUMULATIVE_DEFAULT_START,
  type CumulativePoint,
} from "@/lib/momentum-cumulative";

type Cap = "ALL" | "SC" | "MC" | "LC";

type CumulativePayload = {
  filters: {
    country: string;
    cap: Cap;
    aggregation: MomentumAggregation;
    signal: string;
    start: string;
    end: string;
  };
  options: {
    countries: string[];
    caps: string[];
    aggregations: string[];
    signals: string[];
    firstDate: string | null;
    lastDate: string | null;
  };
  points: CumulativePoint[];
  skippedDates: string[];
};

type PlotPoint = {
  /** End of the period, where the compounded value is plotted. */
  x: number;
  cumulative: number;
  /** Null for the origin point. */
  period: CumulativePoint | null;
};

const CHART_HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 32, left: 56 };

function toTime(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

function addOneMonth(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next.getTime();
}

function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDate(time: number) {
  return new Date(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function formatSignal(value: string) {
  return value
    .replace("momentum_", "")
    .replace("ma_", "ma ")
    .replaceAll("_", " ");
}

function niceStep(range: number, targetTicks: number) {
  const rough = range / Math.max(targetTicks, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const nice = residual >= 7.5 ? 10 : residual >= 3.5 ? 5 : residual >= 1.5 ? 2 : 1;
  return nice * magnitude;
}

function buildPlotPoints(points: CumulativePoint[]): PlotPoint[] {
  if (points.length === 0) {
    return [];
  }

  return [
    { x: toTime(points[0].date), cumulative: 0, period: null },
    ...points.map((point, index) => ({
      x: points[index + 1] ? toTime(points[index + 1].date) : addOneMonth(point.date),
      cumulative: point.cumulative,
      period: point,
    })),
  ];
}

function maxDrawdown(points: PlotPoint[]) {
  let peak = 1;
  let worst = 0;
  for (const point of points) {
    const wealth = 1 + point.cumulative;
    peak = Math.max(peak, wealth);
    worst = Math.min(worst, wealth / peak - 1);
  }
  return worst;
}

export function MomentumCumulative() {
  const [payload, setPayload] = useState<CumulativePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [country, setCountry] = useState("ALL");
  const [cap, setCap] = useState<Cap>("ALL");
  const [aggregation, setAggregation] = useState<MomentumAggregation>("weighted_mean");
  const [signal, setSignal] = useState(CUMULATIVE_DEFAULT_SIGNAL);
  const [start, setStart] = useState(CUMULATIVE_DEFAULT_START);
  const [end, setEnd] = useState("");
  const [width, setWidth] = useState(720);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(280, Math.floor(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({ country, cap, aggregation, signal, start });
    if (end) {
      params.set("end", end);
    }

    setIsLoading(true);
    setErrorMessage(null);

    fetch(`/api/research/momentum/cumulative?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as CumulativePayload | { message?: string };
        if (!response.ok) {
          throw new Error(
            "message" in data && typeof data.message === "string"
              ? data.message
              : "Cumulative momentum data could not be loaded.",
          );
        }
        if (!ignore) {
          setPayload(data as CumulativePayload);
          setHoverIndex(null);
        }
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Cumulative momentum data could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [aggregation, cap, country, end, signal, start]);

  const plotPoints = useMemo(() => buildPlotPoints(payload?.points ?? []), [payload]);

  const chart = useMemo(() => {
    if (plotPoints.length < 2) {
      return null;
    }

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
    const xMin = plotPoints[0].x;
    const xMax = plotPoints[plotPoints.length - 1].x;
    const values = plotPoints.map((point) => point.cumulative);
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);
    const step = niceStep(rawMax - rawMin || 0.1, 5);
    const yMin = Math.floor(rawMin / step) * step;
    const yMax = Math.ceil(rawMax / step) * step;

    const xScale = (x: number) => MARGIN.left + ((x - xMin) / (xMax - xMin || 1)) * innerWidth;
    const yScale = (y: number) =>
      MARGIN.top + (1 - (y - yMin) / (yMax - yMin || 1)) * innerHeight;

    const yTicks: number[] = [];
    for (let tick = yMin; tick <= yMax + step / 2; tick += step) {
      yTicks.push(Number(tick.toFixed(10)));
    }

    const firstYear = new Date(xMin).getUTCFullYear();
    const lastYear = new Date(xMax).getUTCFullYear();
    const yearSpan = lastYear - firstYear + 1;
    const maxLabels = Math.max(2, Math.floor(innerWidth / 56));
    const yearStep = Math.max(1, Math.ceil(yearSpan / maxLabels));
    const xTicks: number[] = [];
    for (let year = firstYear; year <= lastYear + 1; year += yearStep) {
      const time = Date.UTC(year, 0, 1);
      if (time >= xMin && time <= xMax) {
        xTicks.push(time);
      }
    }

    const path = plotPoints
      .map((point, index) =>
        `${index === 0 ? "M" : "L"}${xScale(point.x).toFixed(1)},${yScale(point.cumulative).toFixed(1)}`,
      )
      .join("");

    return { innerWidth, innerHeight, xScale, yScale, yTicks, xTicks, path, step };
  }, [plotPoints, width]);

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    if (!chart) {
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left + MARGIN.left;
    let nearest = 0;
    let nearestDistance = Infinity;
    plotPoints.forEach((point, index) => {
      const distance = Math.abs(chart.xScale(point.x) - x);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    });
    setHoverIndex(nearest);
  }

  const options = payload?.options;
  const finalPoint = plotPoints.at(-1);
  const years =
    plotPoints.length > 1
      ? (plotPoints[plotPoints.length - 1].x - plotPoints[0].x) / (365.25 * 86_400_000)
      : 0;
  const annualized =
    finalPoint && years > 0 ? (1 + finalPoint.cumulative) ** (1 / years) - 1 : null;
  const drawdown = plotPoints.length > 1 ? maxDrawdown(plotPoints) : null;
  const hovered = hoverIndex !== null ? plotPoints[hoverIndex] : null;
  const tooltipLeft =
    hovered && chart ? Math.min(Math.max(chart.xScale(hovered.x), 90), width - 90) : 0;

  return (
    <section className="section" id="momentum-cumulative">
      <div className="research-overview card">
        <div className="research-overview__header">
          <div>
            <h2>Cumulative momentum returns</h2>
          </div>
          <div className="research-overview__meta">
            {finalPoint ? (
              <>
                <span className="tag">Total {formatPercent(finalPoint.cumulative)}</span>
                {annualized !== null ? (
                  <span className="tag">Annualized {formatPercent(annualized)}</span>
                ) : null}
                {drawdown !== null ? (
                  <span className="tag">Max drawdown {formatPercent(drawdown)}</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="research-filters research-filters--six">
          <label className="research-filter">
            <span>Market</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              {(options?.countries.length ? options.countries : ["ALL"]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Cap bucket</span>
            <select value={cap} onChange={(event) => setCap(event.target.value as Cap)}>
              {(options?.caps.length ? options.caps : ["ALL", "SC", "MC", "LC"]).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Momentum signal</span>
            <select value={signal} onChange={(event) => setSignal(event.target.value)}>
              {(options?.signals.length ? options.signals : [signal]).map((option) => (
                <option key={option} value={option}>
                  {formatSignal(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Aggregation</span>
            <select
              value={aggregation}
              onChange={(event) => setAggregation(event.target.value as MomentumAggregation)}
            >
              {(options?.aggregations.length ? options.aggregations : MOMENTUM_AGGREGATIONS).map(
                (option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="research-filter">
            <span>Start</span>
            <input
              type="date"
              value={start}
              min={options?.firstDate ?? undefined}
              max={end || options?.lastDate || undefined}
              onChange={(event) => {
                if (event.target.value) {
                  setStart(event.target.value);
                }
              }}
            />
          </label>

          <label className="research-filter">
            <span>End</span>
            <input
              type="date"
              value={end || payload?.filters.end || ""}
              min={start}
              max={options?.lastDate ?? undefined}
              onChange={(event) => setEnd(event.target.value)}
            />
          </label>
        </div>

        {errorMessage ? (
          <div className="research-error">
            <h3>Cumulative returns unavailable</h3>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <div
          className={`cumulative-chart${isLoading ? " cumulative-chart--loading" : ""}`}
          ref={chartRef}
          aria-busy={isLoading}
        >
          {chart ? (
            <svg
              width={width}
              height={CHART_HEIGHT}
              viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
              role="img"
              aria-label={`Cumulative Q5 minus Q1 return for ${formatSignal(signal)}, ${country} / ${cap} / ${aggregation.replace(/_/g, " ")}${finalPoint ? `: ${formatPercent(finalPoint.cumulative)} in total` : ""}.`}
            >
              {chart.yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    className={tick === 0 ? "cumulative-chart__zero" : "cumulative-chart__grid"}
                    x1={MARGIN.left}
                    x2={width - MARGIN.right}
                    y1={chart.yScale(tick)}
                    y2={chart.yScale(tick)}
                  />
                  <text
                    className="cumulative-chart__label"
                    x={MARGIN.left - 8}
                    y={chart.yScale(tick)}
                    dy="0.32em"
                    textAnchor="end"
                  >
                    {formatPercent(tick, chart.step < 0.01 ? 1 : 0)}
                  </text>
                </g>
              ))}
              {chart.xTicks.map((tick) => (
                <text
                  className="cumulative-chart__label"
                  key={tick}
                  x={chart.xScale(tick)}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                >
                  {new Date(tick).getUTCFullYear()}
                </text>
              ))}
              <path className="cumulative-chart__line" d={chart.path} />
              {hovered ? (
                <g>
                  <line
                    className="cumulative-chart__crosshair"
                    x1={chart.xScale(hovered.x)}
                    x2={chart.xScale(hovered.x)}
                    y1={MARGIN.top}
                    y2={CHART_HEIGHT - MARGIN.bottom}
                  />
                  <circle
                    className="cumulative-chart__marker"
                    cx={chart.xScale(hovered.x)}
                    cy={chart.yScale(hovered.cumulative)}
                    r={4.5}
                  />
                </g>
              ) : null}
              <rect
                x={MARGIN.left}
                y={MARGIN.top}
                width={chart.innerWidth}
                height={chart.innerHeight}
                fill="transparent"
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerMove}
                onPointerLeave={() => setHoverIndex(null)}
              />
            </svg>
          ) : (
            <div className="cumulative-chart__empty" style={{ height: CHART_HEIGHT }}>
              {isLoading ? "Loading monthly returns…" : "No completed months in this range."}
            </div>
          )}
          {hovered && chart ? (
            <div className="cumulative-chart__tooltip" style={{ left: tooltipLeft }}>
              <p className="cumulative-chart__tooltip-title">{formatDate(hovered.x)}</p>
              <p>Cumulative: {formatPercent(hovered.cumulative)}</p>
              {hovered.period ? (
                <>
                  <p>Rebalanced: {formatDate(toTime(hovered.period.date))}</p>
                  <p>Month Q5 − Q1: {formatPercent(hovered.period.spread, 2)}</p>
                </>
              ) : (
                <p>Start of strategy</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="research-overview__footer">
          <p>
            Rebalanced on the first trading date of each month: long the top 20% of stocks by the
            selected signal, short the bottom 20%, held for one month, compounded.
          </p>
          <p>
            {payload?.skippedDates.length
              ? `${payload.skippedDates.length} month(s) without data were held flat.`
              : "The latest month appears once its 1-month forward return has completed."}
          </p>
        </div>
      </div>
    </section>
  );
}
