# Contrast Audit — S17a (Nov 8)

WCAG 2.1 relative-luminance ratios measured from the token values in
`frontend/src/index.css`, for every text pair the app actually renders:
body, bright, muted and faint text on `--bg`, `--panel` and `--code-bg`,
and every semantic color used as text on its own tint (chips, feed type
badges, live counts). Rule: ≥ 4.5:1 for normal text (AA), ≥ 3:1 for
large text and non-text UI (dots, strokes).

Method: standard formula — linearize sRGB channels
(`c/12.92` below 0.04045, `((c+0.055)/1.055)^2.4` above),
`L = 0.2126R + 0.7152G + 0.0722B`, ratio `(Lhi+0.05)/(Llo+0.05)`.
Tint backgrounds were measured as their token colors; rgba tints over
panels were composited before measuring.

## What failed before the fix

| Token | Theme | Measured pair | Before | After |
|-------|-------|---------------|--------|-------|
| `--text-faint` | dark | faint on panel / bg | **3.28 / 3.39** | 4.77 / 4.94 |
| `--text-faint` | light | faint on panel / bg | **2.79 / 2.58** | 4.97 / 4.59 |
| `--text-faint` | academic | faint on panel / bg | **2.86 / 2.98** | 4.72 / 4.93 |
| `--success` | light | green on panel / tint | **3.57 / 3.15** | 6.33 / 5.58 |
| `--success` | academic | green on panel / tint | **3.42 / 3.15** | 6.33 / 5.58 |
| `--warning` | light | amber on panel / tint | **3.86 / 3.41** | 5.36 / 4.74 |
| `--warning` | academic | amber on panel / tint | **3.70 / 3.41** | 5.20 / 4.74 |
| `--danger` | light | red on panel / tint | **4.65 / 3.92** | 5.98 / 5.04 |
| `--purple` | light | purple on panel / tint | **4.95 / 4.28** | 6.46 / 5.60 |

`faint` mattered most because it is not decoration: feed timestamps,
`seealso` lines, empty-state copy and footer text are all `faint` —
i.e. content, in 10.5–12.5px type. The semantic colors all appear as
small uppercase chips, so 3:1 "large text" was never an exemption.

## What passed unchanged

Every `--text` / `--text-bright` pair (12.9:1 to 17.2:1), `--muted`
everywhere (4.7–6.0), dark-theme `success`/`danger`/`warning`/`purple`
(5.4–11.9), academic-theme `danger` and `purple` (4.79 and 5.90 on their
tints — left untouched, a token that passes does not move),
`--primary-bright` as link color in all three themes
(5.1–5.9), and the S16a filter chips (new — measured at authoring
time; active chip is bright-on-primary-tint ≥ 5:1 in each theme).

`--teal`, `--coral` and `--info` were left alone: they only ever render
as SVG accents or dots — non-text UI, where the 3:1 bar is met with
headroom in all themes.

## Standing rule

New text colors enter through the token block, not through one-off
hex values. S32 turns this manual audit into a script that re-measures
the pairs on every CI run.
