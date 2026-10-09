# VPS Anatomy — Roadmap & Ship Plan (Oct 9 – Dec 31, 2026)

Goal: a public engineering artifact that teaches live-server architecture on a
real machine, shipped as **v1.0 by December 19**. Reference bar:
`lecharles/llm-fine-tuner-agent-tester`.

Standing rules for every commit:
- Public artifact only. No secrets, env dumps, handoff files, names of people,
  or brand claims in tracked content. `scripts/hygiene.sh` enforces it.
- One slice per commit or small series. Committed, pushed, same day.

## Big rocks

| Rock | Outcome | Window |
|------|---------|--------|
| R1 · History | the scanner DB becomes charts: trends over days/weeks | Oct 10 – Oct 23 |
| R2 · Trust | the app survives reboots and its scanner is tested | Oct 24 – Nov 6 |
| R3 · Depth | lessons cite real code on the box; signal flow measured live | Nov 9 – Nov 27 |
| R4 · Bar | CI, README screenshots, v1.0 release | Nov 30 – Dec 19 |

## Slices

### October — R1 History, open R2

- [ ] S7  Service-count + RAM/disk trend endpoint (`/api/trends/`) reading scan history
- [ ] S8  Histogram bars on Home/Architecture in dashboard style (sqrt scale, value labels)
- [ ] S9  Retention policy: prune raw scans older than 60 days, keep hourly rollups
- [ ] S10 systemd unit `vps-anatomy.service` + `/healthz`; retire tmux launch
- [ ] S11 pytest: ss parser, catalog mapping, change diff, empty-DB baseline
- [ ] S12 Trends UI polish: period toggles (day/week/month), hover detail

### November — R3 Depth

- [ ] S13 Lesson 3 rewrite: each port row links to the real source file on disk
- [ ] S14 Signal-flow live probe: measure localhost hop latencies, render actual ms
- [ ] S15 "Build your own scanner" doc: distill `core/__init__.py` into a guide
- [ ] S16 Changes feed: filter chips by entity/type; link to affected module
- [ ] S17 Accessibility pass: contrast tokens under AA in all three themes, focus rings

### December — R4 Bar, v1.0

- [ ] S18 GitHub Actions CI: typecheck + build + pytest + hygiene scan on push
- [ ] S19 README screenshots (per theme) + one-paragraph quickstart install script
- [ ] S20 Versioned releases: tag v0.4 (R1), v0.5 (R2), v0.6 (R3), v1.0.0
- [ ] S21 Final sweep: broken links, stale copy, schema cleanup; freeze

## Commit train calendar (Mon / Wed / Fri, one slice per day, ~12:00 UTC)

**Pause switch:** create an empty `PAUSE` file at repo root — no further
slices are committed until it's removed.

| Date | Slice | Rock |
|------|-------|------|
| Fri Oct 9 | wrap: roadmap + license + hygiene gate pushed | — |
| Mon Oct 12 | S7 trends endpoint | R1 |
| Wed Oct 14 | S8 histogram bars | R1 |
| Fri Oct 16 | S9 retention + rollups | R1 |
| Mon Oct 19 | S10 systemd unit + /healthz | R2 |
| Wed Oct 21 | S11 scanner tests (pytest) | R2 |
| Fri Oct 23 | S12 trends UI + period toggles | R1 |
| Mon Nov 2–Fri Nov 6 | buffer: soak time on systemd + history data | R2 |
| Mon Nov 9 | S13 lessons cite real code | R3 |
| Wed Nov 11 | S14 live latency probe | R3 |
| Fri Nov 13 | S15 own-scanner guide doc | R3 |
| Wed Nov 18 | S16 changes feed filters | R3 |
| Wed Nov 25 | S17 accessibility pass | R3 |
| Fri Nov 27 | gate: v0.6 tag (Depth complete) | R3 |
| Wed Dec 2 | S18 CI: build + test + hygiene | R4 |
| Fri Dec 4 | S19 README screenshots + installer | R4 |
| Wed Dec 9 | S20 release tagging pass | R4 |
| Wed Dec 16 | S21 final sweep, freeze | R4 |
| Fri Dec 18 | **v1.0.0 tag + release notes** | R4 |
| Dec 19–Jan 4 | holiday freeze | — |

Gates: G1 Nov 6 (Trust soak) · G2 Nov 27 (Depth) · G3 Dec 18 (v1.0).
Missed a day? The slice slides to the next slot; nothing is renumbered.

## Done so far

- [x] S1 v0.2 baseline · S2 design system (3 themes) · S3 scanner reliability
- [x] S4 content pass · S5 public-info hygiene · S6 themed Swagger at `/docs`
- [x] S6b docs third theme = stock Swagger Default · MIT LICENSE · hygiene script

## Backlog (unscheduled)

Auth for non-public endpoints · `?theme=` deep link · report.md export ·
multi-host compare · dark-mode screenshots for og:image.
