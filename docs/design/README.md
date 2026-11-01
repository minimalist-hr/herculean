# Herculean design package

Everything from the Claude Design canvas "Herculean app screens" (version 0.1, 22 October 2026), exported so it can be read without Claude Design. Put this folder in the repo at `docs/design/`. Changes made after the export are listed at the top of `design-document.md`.

**The design is the spec for the UI.** Screens, wording, states and interaction rules are decided. Product, data and technical decisions are not made here; they are planned in the wiki.

## What's here

| Path | What it is | Use it for |
|---|---|---|
| `design-document.md` | The written spec: brand, tokens, components, navigation, interaction and content rules, every screen by area, sample data, parked ideas | Read first. The source of truth for rules. |
| `screen-index.md` | All 88 screens: ID, name, flow row, size, links to every file | Finding a screen by ID |
| `areas/*.png` | One image per area (A, H, W, L, R, E) with every flow row, the screens in place, labelled arrows and "already designed" notes | Seeing how screens connect |
| `screens/dark/*.png`, `screens/light/*.png` | Every screen rendered at 2× (780 px wide), default settings: Racing blue, Chakra Petch, sharp corners | Looking at a screen |
| `html/*.html` | Every screen as plain static HTML (dark), with exact inline styles | Exact sizes, spacing, colors, copy and aria labels |
| `source/*.dc.html`, `source/canvas.json` | The original Claude Design files (templates plus a small `renderVals()` script with the theme logic and sample data) | Theme switching logic, list data, states |
| `tokens/design-tokens.json` | Colors (dark/light × Racing blue/Titanium), status colors, radii, type scale, sizes | Building the theme |
| `brand/` | Logo concepts board, the pillar mark as SVG (on dark, on light, app icon) | App icon, splash, sign in |

## How to read a screen

- **IDs:** area letter, then two digits; the first digit groups screens by flow. Row numbers don't always match that digit (W40–W42 sit in row W5 Month, H10–H19 in row H2 Settings), so use `screen-index.md` for the row of each ID. Board titles read `ID · Area › Screen · state`.
- **"full scroll"** screens are drawn at their full scrolled height, not 844 px.
- **Sheets and confirms** are drawn over a dimmed copy of the screen that opens them.
- **"Already designed" notes** in `areas/` mean the flow reaches a screen that lives in another row. A screen is never drawn twice.
- **Sample data** (Friday 23 October 2026, Filip's split, Smith machine incline bench press 82.5 kg × 10) is design data only. It is consistent across screens, which makes it a good seed and test fixture.

## Notes on the export

- PNGs and static HTML were rendered from the source files with the default Tweaks. The HTML loads Chakra Petch from Google Fonts.
- Interactions in the source (checking a set, picking a radio, typing) are prototype-only and were dropped in the static HTML.
- Fonts in the app: Chakra Petch is the default; Oxanium, Exo 2 and Saira were design alternatives in Tweaks, not app settings. The in-app settings are Theme (Match my phone, Dark, Light), Color (Racing blue, Titanium) and Units (Metric, Imperial).
