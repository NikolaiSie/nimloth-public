---
title: From end to end
summary: >-
  Nimloth Capital is a project that fits in 6 boxes, which span the whole work
  of systematic investing: Data, infrastructure, research, risk, optimization,
  and trading.
publishedAt: 2026-09-13
tags:
  - personal
  - research
featured: true
---

Nimloth Capital is a project that fits in 6 boxes, which span the whole work of systematic investing: Data, Infrastructure, Research, Risk, Optimization, and Trading. Anything else is noise or business, so everything I write will fit into a box. Each of these 6 is a big job, but they are all that's needed to beat the stock market.

Data is the blood, and everyone needs to treat it with respect. It doesn't take many bad data points to ruin a model. Not all operators have good data quality. That means for the ones who do, data quality is a competitive edge. 

Infrastructure is the serious business of underappreciated engineers. If your data is pure, it can be a finely tuned network of vessels feeding each of your fund's functions. If not, it's the piping for your sewage. It needs to suck data in and transform it into something we can use for predictions, track the models that do the predictions and the predictions themselves, host risk and optimization models, and connect to a platform for trading execution. That's not so many things to reach the minimum viable infra for an end-to-end systematic strategy, but it requires enough Terraform to drive a developer crazy.

Research is the fun part, where everyone wishes they could spend their time, even though it's just one of six boxes. It's everything that turns data into predictions. The simplest is a hypothesis test about some market phenomenon, like whether a low P/E ratio results in outperformance. The toughest is using LLMs together with other models trained on text, numbers, and other media, with state shared between models. The latter kind of research is expensive, and it's why ownership of a large number of GPUs is now an edge.

Risk is easy to forget if you haven't suffered a drawdown before, but it matters more than research if you're trying to stay live for many years (and not just through a single bull market). The obvious first principle is to diversify across as many categories as possible and limit the use of leverage. More detailed models will expose portfolio weaknesses, like excessive momentum exposure, and can identify effective hedges. But the more complicated a model is the more deeply it hides its estimation errors. Sending all your assets into the same risk grinder will confuse things like bank sector exposure with the leverage factor. The best approach is to use a lot of risk models, as many as you can understand and absorb.

Optimization is where it all comes together. Maximize the return predictions from research and minimize the risk. A robust optimizer will find the balance and tell you the portfolio you need to hold. Researchers like to stop here, because the entire project is still fictional, which means it's still nice. But it's not over until the strategy hits the market. The only serious way to think about returns is returns after trading cost, and that's an estimate that comes from the next box.

Trading is where good strategies die and great strategies make your year. It's the real test of any piece of research. Every single piece of financial research that hasn't been traded is a fiction. Trading is where money is made, and that's what this is all about.

And that's the end. Those are six boxes that complete a systematic equity strategy from start to finish. I am spending the next 2 years at Columbia building these out in a way I was never able to do in my Norges role. At the time of writing, the heavy lifting on data and infra is done, and my focus is on getting an MVP through optimization and into experimental trading. I'm more than happy to hear from potential collaborators or share ideas with other practitioners, so give a shout if this is an interest for you.
