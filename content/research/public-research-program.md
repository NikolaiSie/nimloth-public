---
title: The public research program
summary: A working outline for what belongs on the public side of a quantitative trading operation and what must remain private.
publishedAt: 2026-07-26
tags:
  - research
  - strategy
featured: true
---

## Public by default, private by exception

The public site is not meant to mirror every internal system. It is meant to publish conclusions, methods, and engineering decisions that remain useful even when the proprietary edge stays private.

That leads to a simple split:

- Public: architecture notes, experiment design, model governance, reliability lessons, and research essays
- Private: raw data access, execution logic, sensitive feature pipelines, and anything that would weaken operational security

## Why this split matters

Quantitative systems are built from many layers of work. Only some of those layers need secrecy. A clear public boundary forces discipline and helps separate defensible infrastructure from hand-wavy mystique.

## A standard for publication

If a result is published here, it should be possible to explain:

- what question was asked,
- what evidence was considered,
- what assumptions were imposed, and
- what would falsify the conclusion.
