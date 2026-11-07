---
title: Putting the data to work
summary: A live snapshot of the performance of all momentum factors across the world.
publishedAt: 2026-09-23
tags:
  - data
  - momentum
  - global equities
featured: true
---

Data is the beginning of all systematic trading. Mine comes from FMP, EODHD, Polymarket, and the gracious European Central Bank. These are cheap sources compared to institutional grade systems, which means they have a lot of bad prints. The most useful way to pressure test a new data source is to start building with it, trace all its errors to their sources, and beat them up until they're perfect. The below momentum heatmap is above all the result of extensive cleaning of retail-grade datasets.

The matrix below relates past momentum to future performance for any date in all major markets. The row labels are historical momentum metrics, starting with total return and contintuing to the ratios of shorter to longer moving averages, which is a smoother momentum measure.

The cells show the mean, median, or weighted (by market cap) mean total return of the top 20% of stocks, as ranked by the momentum metric for the row, minus the return of the bottom 20% stocks.

{{heatmap}}

\* The columns have forward returns from the selected date (for "Latest", fwd returns show the most recently completed periods, mean 1y return is the momentum metric's performance over the past year).