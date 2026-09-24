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

Data is the beginning of all systematic trading. Mine comes from FMP, EODHD, Polymarket, and the gracious European Central Bank. These are cheap sources compared to institutional grade systems. The best way to put a new source to work is to build a useful visualization out of it.

See below the matrix relating past momentum to future performance for any date in all major markets covered in EODHD. The row labels are historical momentum metrics, starting with total return. Further down it shows the ratios of recent to longer moving averages, which is a smoother momentum measure. The columns have forward total returns from the selected date (if a recent date is selected, forward 1 year return and similar isn't valid, so the data fills in the most recent return availble for that period).

The cells show the mean or median total return of the top 20% of stocks, as ranked by the momentum metric in the row, minus the return of the bottom 20% stocks. Pick a market, aggregation method, size to see how momentum has performed based on different calculations and over different forward horizons.