---
title: Risk without factors
summary: >-
  There are other ways to beat the curse of dimensionality that stay mathematically rigorous and save on compute and storage. Random Matrix Theory gives estimators of the best correlation matrix for portfolio optimization. I investigate what its eigenspace tells us about the markets and test whether we can use cleaned correlations to build better portfolios than with factors.
publishedAt: 2026-11-23
tags:
  - risk
  - random matrix theory
  - portfolio optimization
featured: false
---

Factor models are everywhere, because they're faster to optimize. Great economists have made their names contributing to the specifications of these models. But using them requires large data machinery or expensive third-party imports. The model specs have many steps, and each step introduces more model risk. That's the real problem: with so many steps, misestimation is unavoidable. The obvious example is a factor-model beta that has nothing to do with a stock's actual beta.

The nice thing is that we don't need to model the risk of the whole universe, only the stocks we're interested in, meaning those in which we currently have active risk or are considering taking it. Here I use two basic three-layer neural net models with MSE loss to predict stock returns at 5-day and 1-month horizons across the liquid global universe, and I take the top 200 picks of each model as a candidate universe. Then I use estimators from Random Matrix Theory (RMT) to find optimal covariance matrices of tractable size and test portfolio construction with them.

## Part 1: The obvious signals in the candidate universe

The models take well-tested anomalies as input: momentum, reversal, value factors, accruals, country/sector categories, and more. For test date 2026-11-20, the union of the two models' picks gives 323 candidates. Here's the sample correlation I take as a baseline risk model. With no country constraints, the models love the US, Canada, and Taiwan at the moment.

![Sample correlation of weekly returns of the candidates, grouped by country and sector](/blog/risk-without-factors/correlation-matrix.png)

I use weekly returns because the trading days in Asia and the US don't overlap, so their daily correlations are often meaningless. I use two years because a longer window would include outdated data. That gives us 104 observations for the 316 stocks with a full two-year history, which is not enough, so 213 of the eigenvalues are 0. This is the other reason people use factor models.

Two papers try to solve this. Bun, Bouchaud and Potters (2017) use RMT to find an optimal estimator of the true (population) correlation matrix from a sample matrix, and Ledoit and Wolf (2020) give an estimator that also works with more stocks than observations.

### a. Math foundation

The covariance matrix is what goes into the optimizer. To align with public research, I factor it as $\Sigma = D^{1/2} C D^{1/2}$, with $D$ the diagonal matrix of variances and $C$ the correlation matrix. With $N$ stocks, $T$ periods, standardized returns as a $T\times N$ matrix $X$, and $\lambda_k$ as eigenvalues, the sample correlation matrix is

$$
E = \frac1T X^\top X = \sum_{k=1}^N \lambda_k\, u_k u_k^\top,
\qquad \lambda_1 \ge \dots \ge \lambda_N \ge 0, \qquad \tfrac1N \textstyle\sum_k \lambda_k = 1 .
$$

**Signal vs noise:** For i.i.d. returns, the eigenvalues follow the Marchenko–Pastur distribution (Marchenko & Pastur, 1967) on $[\lambda_-, \lambda_+]$, with $\lambda_\pm = \sigma^2(1 \pm \sqrt q)^2$ and $q = N/T$. The idea from academia is that eigenvalues inside that interval cannot be told apart from noise (Plerou et al., 2002). Because the market factor takes up $\lambda_1/N$ of the variance, the noise level that's left is $\sigma^2 = 1 - \lambda_1/N$. I'll test that before testing the risk models.

### b. Eigenvalues

Since $q > 1$, most eigenvalues are 0 and only 103 are above 0. Most of the non-zero ones are inside the Marchenko–Pastur band and 7 are above it, which suggests we have 7 risk factors with signal and 96 noise factors.

![Non-zero eigenvalues against the Marchenko–Pastur law](/blog/risk-without-factors/eigenvalues.png)

### c. Eigenvectors

Each eigenvector $u_k$ has one component for each stock, and reads as a long-short portfolio: the stocks with positive components tend to move together against those with negative ones, relative to the rest of the eigenspace. The market vector is the strongest, with all stocks loading on it in the same direction, and its eigenvalue is 58. The next four signal eigenvectors have these country and sector tilts:

![Country and sector loadings of eigenvectors u2 to u5](/blog/risk-without-factors/eigenvector-heatmaps.png)

So the most powerful factors in our candidate universe are:

1. The market
2. Short energy vs long the universe
3. Long volatile sectors mainly in China and Taiwan
4. Short China and Taiwan vs the universe
5. Long tech and industrials vs the universe

## Part 2: The signals living inside the noise band

Leading papers describe eigenvalues inside the Marchenko–Pastur band as more or less indistinguishable from noise, but if you spend time working with stocks, you'll find a lot of meaning in things that are hard to measure. I'll try to measure them here by looking for significant similarities between stocks below the noise cutoff. I take the top 30 eigenvectors of the correlation matrix from the entire global liquid universe, some with eigenvalues above and some below the noise cutoff. Then I pick the 10 stocks with the largest components on each side of each vector, and embed their latest earnings call transcripts with an embedding model from the sentence-transformers library (BGE base; Reimers & Gurevych, 2019; Xiao et al., 2024). If the embeddings' cosine similarity is greater than a random baseline, we can say the smaller eigenvalues still carry a signal.

The baseline is 5,000 random groups drawn from the liquid universe's companies with an earnings call transcript. Each group of top stocks is scored by its similarity percentile among the random groups.

![Full liquid universe: earnings-call similarity of the 30 largest modes' groups against 5,000 random groups](/blog/risk-without-factors/similarity-percentiles-liquid.png)

The big similarity cluster lies at the top of the range, as we should expect. Some standouts are gold miners and defense, which have seen intense moves over the last two years. Two groups that lie inside the Marchenko–Pastur band clear the 95th percentile hurdle in similarity: Argentine stocks and network security / power infrastructure. Intuitively these should be signal factors, even if their correlations aren't strong enough to clear the Marchenko–Pastur edge. Out of the 15 groups below the edge, chance alone would put 0.75 above the 95th percentile, and two or more 17% of the time, so this isn't proof on its own. But the 95th percentile is a strict hurdle, and some other groups get close and may well move together in the future.

At the same time, some vectors that look like clear signal on correlation look dissimilar by text. The real conclusion is that the eigenvalues are a good guide, but there's so much noise in the data that we'll find some spurious factors and miss some important ones if we rely too much on them.

## Part 3: Cleaned risk in portfolio construction

### a. Two estimators of the oracle

I take the risk models from the two papers. Both keep the sample eigenvectors and replace only the eigenvalues, giving a cleaned matrix of the form $\Xi = \sum_k \xi_k\, u_k u_k^\top$. We want to get as close as possible to the true correlation matrix $C$, so we try to find $\xi_k = u_k^\top C\, u_k$, the true variance in direction $u_k$.

**Bun, Bouchaud and Potters (2017)** estimate the eigenvalues as 

$$
\hat\xi_k = \frac{\lambda_k}{\bigl|1 - q + q\,\lambda_k\, g_E(\lambda_k - i\eta)\bigr|^2}\,\max(1, \Gamma_k),
$$

where $g_E$ is the Stieltjes transform of the sample eigenvalues, $\eta$ a small smoothing width, and $\max(1, \Gamma_k)$ a correction which undoes a downward bias of the small eigenvalues at finite $N$. Their paper only considers $q < 1$, so for $q > 1$ we give the zero eigenvalues one common value that enforces $\operatorname{tr}\Xi = N$.

**Ledoit and Wolf (2020)** estimate the density $f$ of the non-zero eigenvalues and its Hilbert transform $\mathcal H f$ with a kernel of bandwidth $(T-1)^{-1/3}\lambda_j$. For $q > 1$ their estimator is

$$
\hat\xi_k = \frac{\lambda_k}{\pi^2 \lambda_k^2 \bigl(f(\lambda_k)^2 + \mathcal H f(\lambda_k)^2\bigr)},
\qquad \hat\xi_0 = \frac{1}{\pi\,(q-1)\,\mathcal H f(0)},
$$

with the common value $\hat\xi_0$ for all zero eigenvalues (Appendix C of the supplement to Ledoit & Wolf, 2020).

![Cleaned against sample eigenvalues](/blog/risk-without-factors/cleaned-eigenvalues.png)

As expected, cleaning shrinks the large eigenvalues and most correlations, and gives the zero eigenvalues a common value below 1.

![Each cleaned matrix minus the sample one, and every pair's cleaned correlation against its sample value](/blog/risk-without-factors/cleaned-minus-sample.png)

### b. Backtest

I run a long-only backtest three times, once each with the sample, Bun et al. and Ledoit–Wolf risk models. Stock selection is done out-of-sample over the past year by neural net predictions over 5-day and 1-month forward horizons, and portfolio construction is done using multi-period optimization as in Boyd et al. (2017). Trade costs combine fee schedules by market and from Interactive Brokers, and impact costs are quadratic. The main constraint is portfolio beta held close to 1, as measured versus a custom index from the global liquid universe over FMP and EODHD data. What we want to see from the cleaned risk models is lower volatility and higher Sharpe, hopefully without losing absolute returns.

![Cumulative return after costs against the universe index, realized and predicted volatility, and effective number of positions with each covariance matrix](/blog/risk-without-factors/backtest.png)

### c. Results

We do see lower volatility using cleaned risk for portfolio construction but also lower performance, to the point where the Sharpe ratio falls, meaning the trade-off is poor. With the global index returning 10% over the period, portfolio construction with the sample covariance beat the index by 4.2% before costs and 2.8% after costs. That's a sound result, but looking over the return trajectory it depends on timing. The cleaned constructions did not beat the index, even before costs.

| | Sample | Bun et al. | Ledoit–Wolf |
|---|---|---|---|
| Gross total return | +14.2% | +8.9% | +9.6% |
| Gross relative return | +4.2% | -1.1% | -0.4% |
| Trading costs | 1.4% | 1.0% | 1.0% |
| Net total return | +12.8% | +7.9% | +8.6% |
| Net relative return | +2.8% | -2.1% | -1.4% |
| Realized volatility | 11.0% | 9.5% | 9.9% |
| **Sharpe ratio** | **1.04** | **0.77** | **0.79** |

### d. Conclusion

The encouraging result is that correlation cleaning lowered risk with both method, but it did not improve risk/reward. These results come from a single year's backtest, so they aren't statistically significant, but are rather a counterexample.

It's concerning that leading risk cleaning efforts only replace eigenvalues, when Part 2 of this post shows the extent of noise in eigenvectors. Since the eigenvectors are effectively factors, it makes sense to replace them with factors chosen based on economic reasoning, which is the common practice in risk research. So the above result supports the industry norm.

I'll continue running experiments using both sample and Ledoit–Wolf correlations, while expanding Nimloth capabilities to factor modeling.

## References

- Boyd, S., Busseti, E., Diamond, S., Kahn, R. N., Koh, K., Nystrup, P., & Speth, J. (2017). [Multi-period trading via convex optimization](https://arxiv.org/abs/1705.00109). *Foundations and Trends in Optimization*, 3(1), 1–76.
- Bun, J., Bouchaud, J.-P., & Potters, M. (2017). [Cleaning large correlation matrices: Tools from random matrix theory](https://arxiv.org/abs/1610.08104). *Physics Reports*, 666, 1–109.
- Ledoit, O., & Wolf, M. (2020). [Analytical nonlinear shrinkage of large-dimensional covariance matrices](https://doi.org/10.1214/19-AOS1921). *Annals of Statistics*, 48(5), 3043–3065. The case of more stocks than observations is in Appendix C of the [supplementary material](https://doi.org/10.1214/19-AOS1921SUPP).
- Marchenko, V. A., & Pastur, L. A. (1967). [Distribution of eigenvalues for some sets of random matrices](https://doi.org/10.1070/SM1967v001n04ABEH001994). *Mathematics of the USSR-Sbornik*, 1(4), 457–483.
- Plerou, V., Gopikrishnan, P., Rosenow, B., Amaral, L. A. N., Guhr, T., & Stanley, H. E. (2002). [Random matrix approach to cross correlations in financial data](https://doi.org/10.1103/PhysRevE.65.066126). *Physical Review E*, 65, 066126.
- Reimers, N., & Gurevych, I. (2019). [Sentence-BERT: Sentence embeddings using Siamese BERT-networks](https://arxiv.org/abs/1908.10084). *Proceedings of EMNLP-IJCNLP*.
- Xiao, S., Liu, Z., Zhang, P., Muennighoff, N., Lian, D., & Nie, J.-Y. (2024). [C-Pack: Packed resources for general Chinese embeddings](https://arxiv.org/abs/2309.07597). *Proceedings of the 47th International ACM SIGIR Conference on Research and Development in Information Retrieval*. Introduces the BGE models; I use `BAAI/bge-base-en-v1.5`.
