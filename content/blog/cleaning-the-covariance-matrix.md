---
title: Risk modeling without factors
summary: >-
  There are other ways to beat the curse of dimensionality that stay mathematically rigorous and save on compute and storage. Random Matrix Theory shows us how to find the best correlation matrix for alpha optimization. I test it on global data and investigate what its eigenvalues tell us about the markets.
publishedAt: 2026-11-23
tags:
  - risk
  - random matrix theory
  - portfolio optimization
featured: false
---

Factor models are everywhere, because they're faster to optimize. Great economists have made their names contributing to the specifications of these models. But using them requires large data machinery or expensive third-party imports. The model specs also have many steps, from factor selection to market orthogonalization to the final cross-sectional regression, and each step introduces more model risk. That's the real problem: the factor models I've tried have been misspecified. With so many steps, it's unavoidable. The obvious example is a factor-model beta that has nothing to do with a stock's actual beta.

The nice thing is that we don't need to model the risk of the whole universe, only of the stocks we're interested in: those in which we currently have active risk or are considering taking it. Here, I use two basic three-layer neural net models with MSE loss to predict stock returns at 5-day and 1-month horizons across the liquid global universe, and I take the top 200 picks of each model as a candidate universe. Then I use estimators from Random Matrix Theory (RMT) to find optimal covariance matrices of tractable size and test portfolio construction approaches with them.

## Part 1: The obvious signals in the candidate universe

The models take well-tested anomalies as input: momentum, reversal, value factors, accruals, and more. For a test date, 2026-11-20, the union of the two models' picks gives 327 candidates, 320 of which have a full two-year history. Here's the sample correlation I take as a baseline risk model. With no country constraints, the models are loving the US, Canada, and Taiwan right now.

![Sample correlation of weekly returns of the candidates, grouped by country and sector](/blog/cleaning-the-covariance-matrix/correlation-matrix.png)

I use weekly returns because the trading days in Asia and the US don't overlap, which makes daily correlations between them unreliable [5]. I use two years because a longer window would include outdated data. That gives us 104 observations for 320 stocks, which is not enough: 217 of the eigenvalues are exactly 0. This is the other reason people use factor models.

Two papers try to solve this. Bun, Bouchaud and Potters [1] use RMT to find an optimal estimator of the true (population) correlation matrix from a sample matrix, and Ledoit and Wolf [6] give an estimator that also works with more stocks than observations.

### a. Math foundation

The covariance matrix is what goes into the optimizer. To align with public research, we factor it as $\Sigma = D^{1/2} C D^{1/2}$, with $D$ the diagonal matrix of variances and $C$ the correlation matrix. With $N$ stocks, $T$ periods, standardized returns as a $T\times N$ matrix $X$, and $\lambda_k$ as eigenvalues, the sample correlation matrix is

$$
E = \frac1T X^\top X = \sum_{k=1}^N \lambda_k\, u_k u_k^\top,
\qquad \lambda_1 \ge \dots \ge \lambda_N \ge 0, \qquad \tfrac1N \textstyle\sum_k \lambda_k = 1 .
$$

**Signal vs noise:** For i.i.d. returns, the eigenvalues follow the Marchenko–Pastur distribution [2] on $[\lambda_-, \lambda_+]$, with $\lambda_\pm = \sigma^2(1 \pm \sqrt q)^2$ and $q = N/T$. The idea from academia is that eigenvalues inside that interval cannot be told apart from noise [3, 4]. Because the market factor takes up $\lambda_1/N$ of the variance, the noise level that's left is $\sigma^2 = 1 - \lambda_1/N$ [3]. I'll test that on our candidates before testing the risk models.

### b. Eigenvalues

Since $q > 1$, most eigenvalues are 0 and only 103 are above 0. Most of the non-zero ones are inside the Marchenko–Pastur band and 7 are outside, which suggests we have 7 risk factors with signal and 96 noise factors.

![Non-zero eigenvalues against the Marchenko–Pastur law](/blog/cleaning-the-covariance-matrix/eigenvalues.png)

### c. Eigenvectors

Each eigenvector $u_k$ has one component for each stock, which shows a long-short representation of how they correlate relative to the rest of the eigenspace. The market vector is the strongest: all stocks load on it in the same direction, and its eigenvalue is 58. The next four signal eigenvectors have these country and sector tilts:

![Country and sector loadings of eigenvectors u2 to u5](/blog/cleaning-the-covariance-matrix/eigenvector-heatmaps.png)

So the most powerful factors in our candidate universe are:

1. The market
2. Short energy vs long the universe
3. Long volatile sectors mainly in China and Taiwan
4. Short China and Taiwan vs the universe
5. Long tech and industrials vs the universe

## Part 2: The signals living inside the noise band

Leading papers claim the eigenvalues inside the Marchenko–Pastur band are indistinguishable from noise, but if you spend a lot of time working with stocks, you'll find a lot of meaning in things that are hard to measure. I'll try to measure them here by looking for significant similarities between stocks below the noise cutoff. I take the top 20 eigenvectors, some above and some below the cutoff, pick the 10 stocks with the largest components on each side of each vector, and embed their latest earnings call transcripts with a sentence-embedding model (BGE base [8, 9]). If the embeddings' cosine similarity is greater than a random baseline, we can say the smaller eigenvalues still carry a signal.

The baseline is 5,000 random groups from the candidate universe. Each group of top stocks is scored by its similarity percentile among the random groups.

![Earnings-call similarity of the 20 largest modes' groups against 5,000 random groups](/blog/cleaning-the-covariance-matrix/similarity-percentiles.png)

The spread is wide with a cluster of high similarities mainly consisting of the top eigenvectors. A vector $u8$ of Greek shippers is the best example from below the noise cutoff that provides real signal. But some high eigenvalues have vectors with low text similarity. A closer dive into the long side of $u4$ shows it assembling some healthcare, shipping, and gaming, not an intuitive combination.

The real conclusion is that the amount of noise in the data confuses which factors we can think about as signal or noise. eigenvalue sizes are a good guide, but we'll find real factors below the noise cutoff and faxe factors above it. Even if companies are truly similar, that does not guarantee a risk or factor model will rate them as such. More reason than ever to improve on our sample covariance matrix.

**Note on companies without earnings transcript coverage:** Asian stocks have poor coverage in my data, so I use their company descriptions to rank similarity. All Asian-heavy modes score high in both eigenvalue and text similarity.

| mode | eigenvalue | above edge | side | companies | similarity | percentile | sectors | examples |
|---|---|---|---|---|---|---|---|---|
| 1 | 58.4 | yes | − | 4 | – | – | Financial Services 2, Communication Services 1 | China Mobile Limited; Fideicomiso Irrevocable Numero Cib/2919 (Cfe Fibra E); Flow Traders Ltd.; Aadi Bioscience |
| 3 | 13.6 | yes | + | 10 | 0.576 | 0.999 | Technology 6, Industrials 3 | SL Corporation; Raydium Semiconductor Corporation; Fitipower Integrated Technology Inc.; AmTRAN Technology Co. |
| 4 | 8.8 | yes | − | 10 | 0.560 | 0.987 | Industrials 3, Technology 3 | Altria Group; Hangzhou Xili Intelligent Technology Co.; China Haisum Engineering Co.; Asia Polymer Corporation |
| 6 | 7.1 | yes | − | 10 | 0.578 | 0.999 | Technology 6, Industrials 2 | Fitipower Integrated Technology Inc.; Samsung C&T Corporation; Raydium Semiconductor Corporation; Daeduck Co. |
| 7 | 6.3 | yes | − | 10 | 0.544 | 0.915 | Industrials 3, Energy 3 | Korea Electric Terminal Co.; Sebang Global Battery Co.; Photronics; PT ESSA Industries Indonesia Tbk |

## Part 3: Cleaned risk in the optimizer

### a. Two estimators of the same oracle

I look for my best risk model in two papers. Both keep the sample eigenvectors and replace only the eigenvalues, giving a cleaned matrix of the form $\Xi = \sum_k \xi_k\, u_k u_k^\top$. We want to get as close as possible to the true correlation matrix $C$, so we try to find $\xi_k = u_k^\top C\, u_k$, the true variance in direction $u_k$. Random matrix theory shows that for large $N$ it can be computed from the sample spectrum [1, 6]:

$$
\xi_k = \frac{\lambda_k}{\bigl|\,1 - q + q\,\lambda_k\, g_E(\lambda_k - i\eta)\bigr|^2},
\qquad g_E(z) = \frac1N \sum_{j} \frac{1}{z - \lambda_j},
$$

where $g_E$ is the Stieltjes transform of the sample eigenvalues and $\eta$ a small smoothing width.

**Bun, Bouchaud and Potters** [1] evaluate $g_E$ directly from the eigenvalues, with
$\eta = N^{-1/2}$, and multiply each $\xi_k$ by a correction $\max(1, \Gamma_k)$, which undoes
a downward bias of the small eigenvalues at finite $N$:

$$
\Gamma_k = \frac{\sigma^2}{\lambda_k \,/\, \bigl|1 - q + q\,\lambda_k\, g_{MP}(\lambda_k - i\eta)\bigr|^2}
= \frac{\sigma^2\,\bigl|1 - q + q\,\lambda_k\, g_{MP}(\lambda_k - i\eta)\bigr|^2}{\lambda_k},
$$

where $g_{MP}$ is the Stieltjes transform of the Marchenko–Pastur law with noise level $\sigma^2$.
Their paper only considers $q < 1$, so for $q > 1$ we give the zero eigenvalues one common value that keeps $\operatorname{tr}\Xi = N$.

**Ledoit and Wolf** [6] estimate the density $f$ of the non-zero eigenvalues and its Hilbert transform $\mathcal H f$ with a kernel of bandwidth $(T-1)^{-1/3}\lambda_j$. For $q > 1$ the formula above becomes

$$
\xi_k = \frac{\lambda_k}{\pi^2 \lambda_k^2 \bigl(f(\lambda_k)^2 + \mathcal H f(\lambda_k)^2\bigr)},
\qquad \xi_0 = \frac{1}{\pi\,(q-1)\,\mathcal H f(0)},
$$

with the common value $\xi_0$ for all zero eigenvalues (appendix C of [6]). The Hilbert transform of the density is

$$
\mathcal H f(x) = \frac1\pi\, \mathrm{PV}\!\int \frac{f(t)}{t - x}\, dt .
$$

![Cleaned against sample eigenvalues](/blog/cleaning-the-covariance-matrix/cleaned-eigenvalues.png)

The cleaning mostly pulls correlations toward a central tendency.

![Each cleaned matrix minus the sample one, and every pair's cleaned correlation against its sample value](/blog/cleaning-the-covariance-matrix/cleaned-minus-sample.png)

### b. Backtest

We run the optimizer backtest three times, once with each covariance matrix, and change nothing
else. The settings are those of our backtest notebook: a long-only book of up to 100 stocks, 2.5% per
stock, country and sector caps, a portfolio beta between 0.95 and 1.1, a 10-day planning horizon,
market-impact and broker costs, and P&L marked open to open against the universe index. Two settings
differ, so that the comparison is informative:

- **Risk aversion** `RISK_LAMBDA = 10`. The backtest notebook currently runs with 0, which ignores
  the covariance matrix altogether.
- **Window.** All three matrices use the 104 weeks of Part 1 (the backtest notebook uses 52).

Candidates come from the same MSE models, scored every day from 2025-11-10 to 2026-11-10. The models
were trained on data that overlaps this period, so the backtest is in sample for the forecasts; the
covariance matrices only ever use returns before each date.

For each matrix we report:

- **Realised volatility** of the book's total return, from weekly compounded returns. Weekly is the
  frequency the matrices are estimated at; daily open-to-open returns across time zones would
  understate co-movement (the Epps effect of section 2).
- **Predicted volatility:** what the matrix said the planned portfolio's volatility would be,
  averaged over the year. Their ratio is 1 when a matrix measures risk correctly; above 1 means the
  optimizer was taking more risk than it thought.
- **Volatility relative to the sample matrix,** with a 90% interval from a block bootstrap of the
  paired weekly returns (blocks of 4 weeks). With one year of data the interval is wide; if it
  includes 1, the difference could be chance.
- **Return and costs:** net return against the index, information ratio, turnover and the number of
  positions.

| covariance | Sample | Bun et al. | Ledoit–Wolf |
|---|---|---|---|
| realised volatility | 11.3% | 10.6% | 10.7% |
| predicted volatility | 6.5% | 6.2% | 6.2% |
| realised / predicted | 1.75 | 1.71 | 1.72 |
| volatility vs Sample | 1.000 | 0.939 | 0.949 |
| 90% interval, low | 1.000 | 0.844 | 0.851 |
| 90% interval, high | 1.000 | 1.004 | 1.007 |
| tracking error vs index | 7.9% | 6.8% | 7.0% |
| net return vs index | 12.4% | 7.7% | 9.2% |
| net information ratio | 1.43 | 1.00 | 1.17 |
| mean one-way turnover | 3.4% | 3.2% | 3.1% |
| costs (return) | 3.01% | 2.83% | 2.68% |
| mean holdings | 68 | 81 | 81 |
| mean effective holdings | 54 | 60 | 61 |
| dates not optimal | 4 | 2 | 2 |

![Predicted and realised volatility with each covariance matrix](/blog/cleaning-the-covariance-matrix/volatility.png)

![Cumulative return against the index, realised and predicted risk, and effective holdings with each covariance matrix](/blog/cleaning-the-covariance-matrix/backtest.png)

### 11. Results of the backtest

Numbers are from the backtest from 2025-11-10 to 2026-11-10 (261 trading dates), with the two MSE
models, `RISK_LAMBDA = 10` and 104 weeks of returns for each covariance matrix.

| | Sample | Bun et al. | Ledoit–Wolf |
|---|---|---|---|
| Realised volatility | 11.3% | 10.6% | 10.7% |
| Volatility vs sample (90% interval) | 1 | 0.94 (0.84–1.00) | 0.95 (0.85–1.01) |
| Realised / predicted | 1.75 | 1.71 | 1.72 |
| Net return vs index | +12.4% | +7.7% | +9.2% |
| Effective positions | 54 | 60 | 61 |
| Costs | 3.0% | 2.8% | 2.7% |

**1. The cleaned matrices give a less volatile book, but one year cannot confirm it.** With either
cleaned matrix the book's realised volatility is about 5–6% lower than with the sample matrix (10.6%
and 10.7% against 11.3%), and its tracking error against the index is lower too (6.8% and 7.0%
against 7.9%). The 90% intervals reach just past 1, so a year of weekly returns cannot rule out that
the difference is luck. The two cleaned matrices behave almost the same, as their eigenvalues in
section 9 suggest.

**2. Every matrix under-predicts risk by about 1.7×, and cleaning barely changes that.** Predicted
volatility stays near 6–7% throughout the year, while realised volatility over 13 weeks rose to
15–18% from March to July. That is a change in the level of volatility, which no estimator built
from two years of past returns can foresee, rather than the optimizer exploiting noisy directions.
If it were the latter, the sample matrix would be fooled much more than the cleaned ones; its ratio
(1.75) is only slightly worse than theirs (1.71–1.72). The long-only constraint and the 2.5% cap on
each position already stop the optimizer from leaning on the sample matrix's zero-variance directions
[7].

**3. The cleaned matrices spread the book wider.** They hold about 81 positions instead of 68 (60
and 61 effective positions instead of 54), trade a little less (3.2% and 3.1% one-way turnover a day
against 3.4%) and pay less in costs (2.8% and 2.7% against 3.0%). This is what removing noise should
do: the sample matrix sees some combinations of energy or financial stocks as nearly riskless and
concentrates in them, while the cleaned matrices treat them as more alike.

**4. The sample matrix earned more.** Net of costs, the book beat the index by 12.4% with the sample
matrix, 9.2% with Ledoit–Wolf and 7.7% with Bun et al. Bun et al. fell behind from May, and most of
the gap to Ledoit–Wolf opened in the last two months. A more concentrated book follows the return forecasts more closely, which paid off this
year, but with an information ratio of about 1 to 1.4 the standard error over one year is about 1,
so the three returns cannot be told apart either.

**What this means for the optimizer.** Cleaning the matrix makes the book more diversified and
slightly less volatile at a slightly lower cost, and changes the forecast of risk very little. The
larger problem is calibration: the book's realised risk is about 1.7 times the forecast whichever
matrix is used, so `RISK_LAMBDA` is effectively applied to a risk that is too small. A volatility forecast that
adapts to the current level, such as an exponentially weighted variance applied on top of the cleaned
correlation, is the next thing to test.

**Caveats.** The backtest is in sample: the models' training data may overlap the backtest
year, so the returns can overstate what the models would have earned; the comparison between matrices is fairer than the
level. One year of one strategy is a small sample, and the intervals above say so. The data the
backtest reads keeps updating, so a rerun will give slightly different numbers.

## References

1. Bun, J., Bouchaud, J.-P., & Potters, M. (2017). [Cleaning large correlation matrices: Tools from random matrix theory](https://arxiv.org/abs/1610.08104). *Physics Reports*, 666, 1–109.
2. Marchenko, V. A., & Pastur, L. A. (1967). Distribution of eigenvalues for some sets of random matrices. *Mathematics of the USSR-Sbornik*, 1(4), 457–483.
3. Laloux, L., Cizeau, P., Bouchaud, J.-P., & Potters, M. (1999). Noise dressing of financial correlation matrices. *Physical Review Letters*, 83, 1467.
4. Plerou, V., Gopikrishnan, P., Rosenow, B., Amaral, L. A. N., Guhr, T., & Stanley, H. E. (2002). Random matrix approach to cross correlations in financial data. *Physical Review E*, 65, 066126.
5. Epps, T. W. (1979). Comovements in stock prices in the very short run. *Journal of the American Statistical Association*, 74(366), 291–298.
6. Ledoit, O., & Wolf, M. (2020). Analytical nonlinear shrinkage of large-dimensional covariance matrices. *Annals of Statistics*, 48(5), 3043–3065. The case of more stocks than observations is in Appendix C of the supplementary material.
7. Jagannathan, R., & Ma, T. (2003). Risk reduction in large portfolios: Why imposing the wrong constraints helps. *Journal of Finance*, 58(4), 1651–1683.
8. Reimers, N., & Gurevych, I. (2019). [Sentence-BERT: Sentence embeddings using Siamese BERT-networks](https://arxiv.org/abs/1908.10084). *Proceedings of EMNLP-IJCNLP*.
9. Xiao, S., Liu, Z., Zhang, P., & Muennighoff, N. (2023). [C-Pack: Packaged resources to advance general Chinese embedding](https://arxiv.org/abs/2309.07597). Introduces the BGE models; we use `BAAI/bge-base-en-v1.5`.
