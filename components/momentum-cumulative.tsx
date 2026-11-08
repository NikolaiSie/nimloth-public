"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MOMENTUM_AGGREGATIONS, type MomentumAggregation } from "@/lib/momentum-aggregations";
import {
  CUMULATIVE_DEFAULT_SIGNAL,
  CUMULATIVE_DEFAULT_START,
  formatCapLabel,
  formatSignalLabel,
  marketOptions,
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
  };
  options: {
    countries: string[];
    countryNames: Record<string, string | null>;
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

const MARGIN = { top: 20, right: 64, bottom: 34, left: 52 };
const AGGREGATION_LABELS: Record<string, string> = {
  mean: "Mean",
  median: "Median",
  weighted_mean: "Weighted mean",
};

function toTime(date: string) {
  return Date.parse(`${date}T00:00:00Z`);
}

function addOneMonth(date: string) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next.getTime();
}

function formatPercent(value: number, digits = 1, signed = false) {
  const text = `${(value * 100).toFixed(digits)}%`;
  return signed && value > 0 ? `+${text}` : text;
}

function formatMonth(time: number) {
  return new Date(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function formatDay(time: number) {
  return new Date(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
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
  const [start, setStart] = useState(CUMULATIVE_DEFAULT_START);
  const [country, setCountry] = useState("ALL");
  const [cap, setCap] = useState<Cap>("ALL");
  const [signal, setSignal] = useState(CUMULATIVE_DEFAULT_SIGNAL);
  const [aggregation, setAggregation] = useState<MomentumAggregation>("weighted_mean");
  const [width, setWidth] = useState(760);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const gradientId = useId().replace(/:/g, "");

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

    setIsLoading(true);
    setErrorMessage(null);

    fetch(`/api/research/momentum/cumulative?${params.toString()}`)
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
  }, [aggregation, cap, country, signal, start]);

  const plotPoints = useMemo(() => buildPlotPoints(payload?.points ?? []), [payload]);
  const height = width < 520 ? 260 : 340;

  const chart = useMemo(() => {
    if (plotPoints.length < 2) {
      return null;
    }

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;
    const xMin = plotPoints[0].x;
    const xMax = plotPoints[plotPoints.length - 1].x;
    const values = plotPoints.map((point) => point.cumulative);
    const rawMin = Math.min(0, ...values);
    const rawMax = Math.max(0, ...values);
    const step = niceStep(rawMax - rawMin || 0.1, height < 300 ? 4 : 5);
    const yMin = Math.floor(rawMin / step) * step;
    const yMax = Math.ceil(rawMax / step) * step;

    const xScale = (x: number) => MARGIN.left + ((x - xMin) / (xMax - xMin || 1)) * innerWidth;
    const yScale = (y: number) => MARGIN.top + (1 - (y - yMin) / (yMax - yMin || 1)) * innerHeight;

    const yTicks: number[] = [];
    for (let tick = yMin; tick <= yMax + step / 2; tick += step) {
      yTicks.push(Number(tick.toFixed(10)));
    }

    const firstYear = new Date(xMin).getUTCFullYear();
    const lastYear = new Date(xMax).getUTCFullYear();
    const maxLabels = Math.max(2, Math.floor(innerWidth / (innerWidth < 400 ? 44 : 58)));
    const yearStep = Math.max(1, Math.ceil((lastYear - firstYear + 1) / maxLabels));
    const xTicks: number[] = [];
    // Ticks land on round years (multiples of the step), e.g. 2015, 2020, 2025.
    for (let year = Math.ceil(firstYear / yearStep) * yearStep; year <= lastYear + 1; year += yearStep) {
      const time = Date.UTC(year, 0, 1);
      if (time >= xMin && time <= xMax) {
        xTicks.push(time);
      }
    }

    const line = plotPoints
      .map((point, index) => `${index === 0 ? "M" : "L"}${xScale(point.x).toFixed(1)},${yScale(point.cumulative).toFixed(1)}`)
      .join("");
    const zeroY = yScale(0);
    const area = `${line}L${xScale(xMax).toFixed(1)},${zeroY.toFixed(1)}L${xScale(xMin).toFixed(1)},${zeroY.toFixed(1)}Z`;

    return { innerWidth, innerHeight, xScale, yScale, yTicks, xTicks, line, area, zeroY, step };
  }, [height, plotPoints, width]);

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
  const markets = marketOptions(options?.countries ?? ["ALL"], options?.countryNames ?? {});
  const signals = options?.signals.length ? options.signals : [signal];
  const finalPoint = plotPoints.at(-1);
  const years =
    plotPoints.length > 1 ? (plotPoints[plotPoints.length - 1].x - plotPoints[0].x) / (365.25 * 86_400_000) : 0;
  const annualized = finalPoint && years > 0 ? (1 + finalPoint.cumulative) ** (1 / years) - 1 : null;
  const drawdown = plotPoints.length > 1 ? maxDrawdown(plotPoints) : null;
  const hovered = hoverIndex !== null ? plotPoints[hoverIndex] : null;
  const tooltipLeft = hovered && chart ? Math.min(Math.max(chart.xScale(hovered.x), 96), width - 96) : 0;
  const marketLabel = markets.find((option) => option.value === country)?.label ?? country;

  return (
    <section className="section" id="momentum-cumulative">
      <div className="research-overview card">
        <div className="research-overview__header">
          <div>
            <h2>Cumulative returns</h2>
          </div>
          <div className="research-overview__meta">
            {finalPoint ? (
              <>
                <span className="tag">Total {formatPercent(finalPoint.cumulative, 1, true)}</span>
                {annualized !== null ? (
                  <span className="tag">Annualized {formatPercent(annualized, 1, true)}</span>
                ) : null}
                {drawdown !== null ? (
                  <span className="tag">Max drawdown {formatPercent(drawdown)}</span>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="research-filters research-filters--five">
          <label className="research-filter">
            <span>Start date</span>
            <input
              type="date"
              value={start}
              min={options?.firstDate ?? undefined}
              max={options?.lastDate ?? undefined}
              onChange={(event) => {
                if (event.target.value) {
                  setStart(event.target.value);
                }
              }}
            />
          </label>

          <label className="research-filter">
            <span>Market</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              {markets.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Cap bucket</span>
            <select value={cap} onChange={(event) => setCap(event.target.value as Cap)}>
              {(options?.caps.length ? options.caps : ["ALL", "SC", "MC", "LC"]).map((option) => (
                <option key={option} value={option}>
                  {formatCapLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="research-filter">
            <span>Signal</span>
            <select value={signal} onChange={(event) => setSignal(event.target.value)}>
              {signals.map((option) => (
                <option key={option} value={option}>
                  {formatSignalLabel(option)}
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
              {(options?.aggregations.length ? options.aggregations : MOMENTUM_AGGREGATIONS).map((option) => (
                <option key={option} value={option}>
                  {AGGREGATION_LABELS[option] ?? option.replace(/_/g, " ")}
                </option>
              ))}
            </select>
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
          {chart && finalPoint ? (
            <svg
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`Cumulative top-minus-bottom quintile return of ${formatSignalLabel(signal)}, ${marketLabel}, ${formatCapLabel(cap).toLowerCase()}, ${(AGGREGATION_LABELS[aggregation] ?? aggregation).toLowerCase()}: ${formatPercent(finalPoint.cumulative)} in total.`}
            >
              <defs>
                <linearGradient id={`${gradientId}-up`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--sea)" stopOpacity="0.26" />
                  <stop offset="100%" stopColor="var(--sea)" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id={`${gradientId}-down`} x1="0" x2="0" y1="1" y2="0">
                  <stop offset="0%" stopColor="var(--bronze)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--bronze)" stopOpacity="0.03" />
                </linearGradient>
                <clipPath id={`${gradientId}-above`}>
                  <rect x={0} y={0} width={width} height={chart.zeroY} />
                </clipPath>
                <clipPath id={`${gradientId}-below`}>
                  <rect x={0} y={chart.zeroY} width={width} height={height - chart.zeroY} />
                </clipPath>
              </defs>

              {chart.yTicks.map((tick) => (
                <g key={tick}>
                  {tick !== 0 ? (
                    <line
                      className="cumulative-chart__grid"
                      x1={MARGIN.left}
                      x2={width - MARGIN.right}
                      y1={chart.yScale(tick)}
                      y2={chart.yScale(tick)}
                    />
                  ) : null}
                  <text
                    className="cumulative-chart__label"
                    x={MARGIN.left - 10}
                    y={chart.yScale(tick)}
                    dy="0.32em"
                    textAnchor="end"
                  >
                    {formatPercent(tick, chart.step < 0.01 ? 1 : 0)}
                  </text>
                </g>
              ))}
              {chart.xTicks.map((tick) => (
                <g key={tick}>
                  <line
                    className="cumulative-chart__tick"
                    x1={chart.xScale(tick)}
                    x2={chart.xScale(tick)}
                    y1={height - MARGIN.bottom}
                    y2={height - MARGIN.bottom + 5}
                  />
                  <text
                    className="cumulative-chart__label"
                    x={chart.xScale(tick)}
                    y={height - 10}
                    textAnchor="middle"
                  >
                    {new Date(tick).getUTCFullYear()}
                  </text>
                </g>
              ))}
              <line
                className="cumulative-chart__axis"
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={height - MARGIN.bottom}
                y2={height - MARGIN.bottom}
              />

              <path className="cumulative-chart__area" d={chart.area} fill={`url(#${gradientId}-up)`} clipPath={`url(#${gradientId}-above)`} />
              <path className="cumulative-chart__area" d={chart.area} fill={`url(#${gradientId}-down)`} clipPath={`url(#${gradientId}-below)`} />
              <line
                className="cumulative-chart__zero"
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={chart.zeroY}
                y2={chart.zeroY}
              />
              <path className="cumulative-chart__line" d={chart.line} clipPath={`url(#${gradientId}-above)`} />
              <path
                className="cumulative-chart__line cumulative-chart__line--negative"
                d={chart.line}
                clipPath={`url(#${gradientId}-below)`}
              />

              <circle
                className="cumulative-chart__end"
                cx={chart.xScale(finalPoint.x)}
                cy={chart.yScale(finalPoint.cumulative)}
                r={4}
              />
              <text
                className="cumulative-chart__end-label"
                x={chart.xScale(finalPoint.x) + 9}
                y={chart.yScale(finalPoint.cumulative)}
                dy="0.32em"
              >
                {formatPercent(finalPoint.cumulative, 0, true)}
              </text>

              {hovered ? (
                <g>
                  <line
                    className="cumulative-chart__crosshair"
                    x1={chart.xScale(hovered.x)}
                    x2={chart.xScale(hovered.x)}
                    y1={MARGIN.top}
                    y2={height - MARGIN.bottom}
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
            <div className="cumulative-chart__empty" style={{ height }}>
              {isLoading ? "Loading monthly returns…" : "No completed months from this start date."}
            </div>
          )}
          {hovered && chart ? (
            <div className="cumulative-chart__tooltip" style={{ left: tooltipLeft }}>
              <p className="cumulative-chart__tooltip-title">{formatMonth(hovered.x)}</p>
              <p>Cumulative {formatPercent(hovered.cumulative, 1, true)}</p>
              {hovered.period ? (
                <>
                  <p>Month Q5 − Q1 {formatPercent(hovered.period.spread, 2, true)}</p>
                  <p>Formed {formatDay(toTime(hovered.period.date))}</p>
                </>
              ) : (
                <p>Start of strategy</p>
              )}
            </div>
          ) : null}
        </div>

      </div>
    </section>
  );
}
