# Design System

## Direction

The public site uses a maritime editorial identity inspired by the visual
character of Numenor: deep water, pale stone, silver, and restrained old gold.
The reference is atmospheric rather than illustrative. The site should feel
scholarly and enduring, not like fantasy merchandise.

The interface follows three principles:

1. Research comes before project scaffolding in the public narrative.
2. Editorial pages use generous type and strict grid lines; data views become
   denser and more instrument-like.
3. Ornament is limited to geometry, a tree-over-water mark, and subtle celestial
   patterns.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Navy | `#071c2f` | Masthead, footer, primary ink |
| Raised navy | `#0c2a42` | Dark surface variation |
| Sea | `#1f6877` | Research accent and positive data |
| Pale sea | `#9db8bc` | Secondary text on dark surfaces |
| Stone | `#eee8dc` | Page background |
| Light stone | `#f8f4eb` | Reading surfaces |
| Silver | `#c5d0d1` | Fine detail and dark-surface text |
| Old gold | `#bd9857` | Navigation and emphasis |
| Light gold | `#dfc894` | Primary action and hero emphasis |
| Bronze | `#b17742` | Negative heatmap values |

Gold is intentionally scarce. It indicates direction or hierarchy rather than
decoration.

## Typography

- Display: Baskerville-style serif for titles and research headings
- Body: Palatino-style serif for long-form reading
- Interface: Optima-style humanist sans serif for controls and metadata

These are platform font stacks rather than downloaded web fonts. This keeps
local development and production builds independent of external font services.

## Mark

The Nimloth mark is an original inline SVG: an abstract tree above two water
lines with a single point of light. It remains legible at navigation size and
does not introduce another asset pipeline.

## Responsive Behavior

The momentum matrix retains every forward horizon without horizontal scrolling.
Labels and values reduce progressively on narrow screens, while tooltips become
fixed panels near the bottom edge so their contents remain readable.
