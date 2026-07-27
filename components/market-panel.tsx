"use client";

import { useEffect, useState } from "react";
import type { MarketSnapshot } from "@/lib/data-api";

const fallbackState: MarketSnapshot = {
  status: "loading",
  asOf: "",
  headline: "Loading latest momentum snapshot",
  summary:
    "The public panel is requesting the latest ALL / ALL / mean slice from server-side code.",
  points: [],
};

export function MarketPanel() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(fallbackState);

  useEffect(() => {
    let ignore = false;

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/market-snapshot", {
          cache: "no-store",
        });
        const data = (await response.json()) as MarketSnapshot;

        if (!ignore) {
          setSnapshot(data);
        }
      } catch {
        if (!ignore) {
          setSnapshot({
            status: "degraded",
            asOf: "",
            headline: "Momentum API request failed",
            summary: "The public route could not load the latest momentum slice.",
            points: [],
          });
        }
      }
    }

    void loadSnapshot();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="metric-card card">
      <div className="market-status">
        <span className="market-status__dot" />
        <span>{snapshot.status}</span>
      </div>
      <h2>{snapshot.headline}</h2>
      <p>{snapshot.summary}</p>
      {snapshot.asOf ? (
        <p className="article-list__meta">
          <span>As of {new Date(snapshot.asOf).toLocaleString()}</span>
        </p>
      ) : null}
      <ul>
        {snapshot.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}
