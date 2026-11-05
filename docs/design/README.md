# Herculean design package

Everything from the Claude Design canvas "Herculean app screens" (version 0.1, 22 October 2026), exported so it can be read without Claude Design. Put this folder in the repo at `docs/design/`. Changes made after the export are listed at the top of `design-document.md`.

**The design is the spec for the UI.** Screens, wording, states and interaction rules are decided. Product, data and technical decisions are not made here; they are planned in the wiki.

## What's here

| Path | What it is | Use it for |
|---|---|---|
| `design-document.md` | The written spec: brand, tokens, components, navigation, interaction and content rules, every screen by area, sample data, parked ideas | Read first. The source of truth for rules. |
| `screen-index.md` | All 206 screens: ID, name, flow row, size, links to every file | Finding a screen by ID |
| `screens/*.png` | Every screen at 2× (780 px wide), default settings: dark, Racing blue, Chakra Petch, sharp corners | Looking at a screen |
| `capture/` | The tool that captures built screens from the running app, with the list of every built screen and state | Updating a screen after a change |
| `html/*.html` | Every screen as plain static HTML (dark), with exact inline styles | Exact sizes, spacing, colors, copy and aria labels |
| `source/*.dc.html`, `source/canvas.json` | The original Claude Design files (templates plus a small `renderVals()` script with the theme logic and sample data) | Theme switching logic, list data, states |
| `tokens/design-tokens.json` | Colors (dark/light × Racing blue/Titanium), status colors, radii, type scale, sizes | Building the theme |
| `brand/` | Logo concepts board, the pillar mark as SVG (on dark, on light, app icon), the whole logo as PNG for email | App icon, splash, sign in |

## How to read a screen

- **IDs:** area letter, then two digits; the first digit groups screens by flow. Row numbers don't always match that digit (W40–W49 sit in row W5 Month, H10–H19 in row H2 Settings), so use `screen-index.md` for the row of each ID. Board titles read `ID · Area › Screen · state`.
- **"full scroll"** screens are drawn at their full scrolled height, not 844 px.
- **Sheets and confirms** are drawn over a dimmed copy of the screen that opens them.
- **Sample data** (Friday 23 October 2026, Filip's split, Smith machine incline bench press 82.5 kg × 10) is design data only. It is consistent across screens, which makes it a good seed and test fixture.

## Built and not built

Built screens, listed in `capture/screens.mjs`, are captured from the running app, so they show what is built. Every other screen is a drawing of what is planned, except A00 and A02, which only the phone can reach, and A13 and A14, the email and the page its link opens, which the API sends. Captures come from the web version, so small details can differ on a phone. The logo glow on A01, A03, A04 and A05 sits higher on the web, and the phone is right. Captured source files have no links between screens.

## Notes on the export

- Drawings: PNGs and static HTML were rendered from the source files with the default Tweaks. The HTML loads Chakra Petch from Google Fonts.
- Interactions in the source (checking a set, picking a radio, typing) are prototype-only and were dropped in the static HTML.
- Fonts in the app: Chakra Petch is the default; Oxanium, Exo 2 and Saira were design alternatives in Tweaks, not app settings. The in-app settings are Theme (Match my phone, Dark, Light), Color (Racing blue, Titanium) and Units (Metric, Imperial).
