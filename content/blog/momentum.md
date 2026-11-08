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

Data is the beginning of all systematic trading. Mine comes from FMP, EODHD, Polymarket, and the gracious European Central Bank. These are cheap sources compared to institutional grade systems, which means they have a lot of bad prints (Ince & Porter, 2006). The most useful way to pressure test a new data source is to start building with it, trace all its errors to their sources, and beat them up until they're perfect. The below momentum heatmap is above all the result of extensive cleaning of retail-grade datasets.

The matrix below relates past momentum to future performance for any date in all major markets. The row labels are historical momentum metrics, starting with total return and contintuing to the ratios of shorter to longer moving averages, which is a smoother momentum measure (Han, Zhou & Zhu, 2016).

The cells show the mean, median, or weighted (by market cap) mean total return of the top 20% of stocks, as ranked by the momentum metric for the row, minus the return of the bottom 20% stocks.

{{heatmap}}

\* The columns have forward returns from the selected date (for "Latest", fwd returns show the most recently completed periods, meaning 1y return is the momentum metric's performance over the past year).

See the cumulative return of the most traditional momentum metric (1 year except the latest month; Jegadeesh, 1990). It's a remarkably consistent signal... except for right now. In the time of writing (Nov 7, 2026) we're having a harsh momentum meltdown and a famous hedge fund deleveraging episode. It's not surprising that this strategy works amazingly until it doesn't (Daniel & Moskowitz, 2016). The surprising thing is that people allocate the most capital to it in the sharp run-ups right before the crashes, which means the consistency in the graph far overstates the gains made by investors (Dichev & Yu, 2011). That's the sad truth of all financial markets.

![Cumulative top-minus-bottom quintile 1-month return for 12-month-ex-1-month momentum, weighted mean, 2016–2026](/blog/momentum/cumulative-12m-ex-1m.png)

{{cumulative}}

## References

- Daniel, K., & Moskowitz, T. J. (2016). [Momentum crashes](https://doi.org/10.1016/j.jfineco.2015.12.002). *Journal of Financial Economics*, 122(2), 221–247.
- Dichev, I. D., & Yu, G. (2011). [Higher risk, lower returns: What hedge fund investors really earn](https://doi.org/10.1016/j.jfineco.2011.01.003). *Journal of Financial Economics*, 100(2), 248–263.
- Han, Y., Zhou, G., & Zhu, Y. (2016). [A trend factor: Any economic gains from using information over investment horizons?](https://doi.org/10.1016/j.jfineco.2016.01.029) *Journal of Financial Economics*, 122(2), 352–375.
- Ince, O. S., & Porter, R. B. (2006). [Individual equity return data from Thomson Datastream: Handle with care!](https://doi.org/10.1111/j.1475-6803.2006.00189.x) *Journal of Financial Research*, 29(4), 463–479.
- Jegadeesh, N. (1990). [Evidence of predictable behavior of security returns](https://doi.org/10.1111/j.1540-6261.1990.tb05110.x). *Journal of Finance*, 45(3), 881–898.

