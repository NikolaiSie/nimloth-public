---
title: Systematics from end to end
summary: >-
  Nimloth Capital is a project that fits in 5 boxes, which span the whole work
  of systematic investing: Data, research, risk, optimization, and trading.
publishedAt: 2026-10-28
tags:
  - nimloth
featured: true
---

Nimloth Capital is a project that fits in 5 boxes, which span the whole work of systematic investing: Data, Research, Risk, Optimization, and Trading. Anything else is noise or business, so everything I write will fit into a box. Each of these 5 is a big job, but they are all that's needed to beat the stock market.

![The five boxes: data feeds research and risk, both feed optimization, optimization feeds trading, and trading's cost estimates feed back into optimization.](/blog/systematics-from-end-to-end/five-boxes.svg)

Data is the blood, and everyone needs to treat it with respect. It doesn't take many bad data points to ruin a model. Not all operators have good data quality. That means for the ones who do, data quality is a competitive edge. 

Research is the fun part, where everyone wishes they could spend their time, even though it's just one of five boxes. It's everything that turns data into predictions. The simplest is a hypothesis test about some market phenomenon, like whether a low P/E ratio results in outperformance. The toughest is using LLMs together with other models trained on text, numbers, and other media, with state shared between models. The latter kind of research is expensive, and it's why ownership of a large number of GPUs is now an edge.

Risk is easy to forget if you haven't suffered a drawdown before, but it matters more than research if you're trying to stay live for many years (and not just through a single bull market). The obvious first principle is to diversify and limit leverage. More detailed models will expose portfolio weaknesses, like excessive beta, and can identify hedges. But the more complicated a model is, the more deeply it hides its estimation errors. Sending all your assets into the same risk grinder will confuse sector and factor exposure. The best approach is to use a lot of risk models, as many as you can understand and absorb.

Optimization is where it all comes together. Maximize the return predictions from research and minimize the risk. A robust optimizer will find the balance and tell you the portfolio you need to hold. Researchers like to stop here, because the entire project is still fictional, which means it's still nice. But it's not over until the strategy hits the market. The only serious way to think about returns is returns after trading cost, and that's an estimate that comes from the next box.

Trading is where good strategies die and great strategies make your year. It's the real test of any piece of research. All research that hasn't been traded is a fiction.

Those are five boxes that complete a systematic equity strategy from start to finish. I'm spending the next 2 years at Columbia building these out in a way I was never able to do in my Norges role. At the time of writing, the heavy lifting on data is done, and my focus is on getting an MVP through optimization and into experimental trading. I'm more than happy to hear from potential collaborators or share ideas with other practitioners, so give a shout if this is an interest for you.
