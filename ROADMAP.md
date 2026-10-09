# VPS Anatomy — Roadmap & Ship Plan (Oct 9 – Dec 31, 2026)

Goal: a public engineering artifact that teaches live-server architecture on a
real machine, shipped as **v1.0 on December 18**. Reference bar:
`lecharles/llm-fine-tuner-agent-tester`.

Standing rules:
- Public artifact only: no secrets, env values, handoff files, person names,
  or brand claims in tracked content. `scripts/hygiene.sh` enforces.
- The repo moves every day. Baseline: `scripts/daily-train.sh` (system crontab,
  05:00 local ≈ 12:00 UTC) commits `data/snapshots/YYYY-MM-DD.json`. Zero LLM.
- Slice days add a real code/docs commit on top of the snapshot.
- Pause switch: `PAUSE` file at repo root. Holiday freeze: Dec 19 – Jan 4.

## Big rocks

| Rock | Outcome | Window |
|------|---------|--------|
| R1 · History | scanner DB becomes charts | Oct 10 – Oct 26 |
| R2 · Trust | survives reboots; scanner is tested | Oct 18 – Nov 14 |
| R3 · Depth | lessons cite real code; flows measured live | Oct 28 – Nov 27 |
| R4 · Bar | CI, screenshots, installer, v1.0 release | Dec 1 – Dec 18 |

## Day-by-day calendar

Every date, October 10 through December 31. Slice letters under R1/R2/R3/R4.
"snapshot" = automated data commit only. Weekends marked (light) are small work.

### October

| Date | Item |
|------|------|
| Fri Oct 9 | train infra: hygiene gate, LICENSE, daily-train script, calendar (done today) |
| Sat Oct 10 (light) | S7a · `/api/trends/` — hourly rollup query + schema |
| Sun Oct 11 (light) | S7b · trends metric params (services, modules, ram, disk) |
| Mon Oct 12 | S7 merge · docs note, ROADMAP tick |
| Tue Oct 13 | S8a · trend bars component — SVG, sqrt scale, value labels |
| Wed Oct 14 | S8b · Home + Architecture get service/module series |
| Thu Oct 15 | S8c · period toggles day/week/month (dashboard language) |
| Fri Oct 16 | S9a · retention job: prune raw >60d, keep hourly rollups |
| Sat Oct 17 (light) | S9b · trends endpoints documented in Swagger |
| Sun Oct 18 (light) | S10a · systemd unit draft `vps-anatomy.service` |
| Mon Oct 19 | S10b · `/healthz` endpoint + enable, boot check |
| Tue Oct 20 | S10c · log rotation; retire tmux launcher in docs |
| Wed Oct 21 | S11a · pytest scaffolding; `ss -tlnp` fixtures |
| Thu Oct 22 | S11b · catalog mapping + change-diff tests |
| Fri Oct 23 | S11c · empty-DB + first-scan baseline regressions (the v0.2 bug class) |
| Sat Oct 24 (light) | S12a · trends UI polish, hover detail |
| Sun Oct 25 (light) | S12b · bar labels + legend copy |
| Mon Oct 26 | **M1 · tag v0.4 (History + Trust complete)** |
| Tue Oct 27 | soak / snapshot only |
| Wed Oct 28 | S13a · Lesson 3 rows link to live `/api/services/` data |
| Thu Oct 29 | S13b · every port row cites real source or config path on disk |
| Fri Oct 30 | S14a · localhost hop-latency probes: design + first numbers |
| Sat Oct 31 (light) | S14b · Signal Flow renders measured hop ms |

### November

| Date | Item |
|------|------|
| Sun Nov 1 (light) | S14c · latency probe error states + fallback copy |
| Mon Nov 2 | S15a · "build your own scanner" guide: skeleton from `core/` |
| Tue Nov 3 | S15b · guide code excerpts (machine, ss, modules, diff) |
| Wed Nov 4 | S15c · guide review + linked from Lesson 3 |
| Thu Nov 5 | S16a · Changes feed filter chips (type · entity) |
| Fri Nov 6 | **G1 · Trust soak checkpoint** — 2 weeks of systemd + tests holding |
| Sat Nov 7 (light) | S16b · change events link to affected module pages |
| Sun Nov 8 (light) | S17a · contrast audit: tokens vs AA in all three themes |
| Mon Nov 9 | S17b · focus rings + keyboard nav between lessons |
| Tue Nov 10 | S17c · reader semantics pass (headings, landmarks) |
| Wed Nov 11 | S22 · Lesson 5 refresh with probe + trends data cited |
| Thu Nov 12 | S23 · Architecture tier live counts (services/modules per tier) |
| Fri Nov 13 | S24 · module detail mini-sparkline per resident |
| Sat Nov 14 (light) | **M2 · tag v0.5 (Trust complete)** |
| Sun Nov 15 | soak / snapshot only |
| Mon Nov 16 | S25 · docs audit: README claims vs behavior, fix deltas |
| Tue Nov 17 | S26 · OpenAPI cleanup: examples per endpoint |
| Wed Nov 18 | S27 · trends CSV export endpoint |
| Thu Nov 19 | S28 · tiny client-side lesson search |
| Fri Nov 20 | S29 · prev/next lesson navigation |
| Sat Nov 21 (light) | S30 · `?theme=` deep-link shared by site + docs |
| Sun Nov 22 | snapshot only |
| Mon Nov 23 | S31 · bundle size + gzip report; first optimization |
| Tue Nov 24 | S32 · automated a11y check script (no tokens) |
| Wed Nov 25 | S33 · mobile layout pass (375px) |
| Thu Nov 26 | Thanksgiving — snapshot only |
| Fri Nov 27 | **G2 · tag v0.6 (Depth complete)** + release notes stub |
| Sat Nov 28 – Sun Nov 29 | snapshot only |
| Mon Nov 30 | S18a · GitHub Actions: typecheck + build + pytest |

### December

| Date | Item |
|------|------|
| Tue Dec 1 | S18b · CI runs hygiene gate on every push |
| Wed Dec 2 | S18c · CI green + status badge in README |
| Thu Dec 3 | S19a · README screenshots (VPS / Light / Academic) |
| Fri Dec 4 | S19b · `install.sh` one-command quickstart |
| Sat Dec 5 (light) | S19c · quickstart verified on clean venv |
| Sun Dec 6 | snapshot only |
| Mon Dec 7 | S20a · CHANGELOG.md from commit history |
| Tue Dec 8 | S20b · tag v0.7 (Bar-up-to-now) |
| Wed Dec 9 | S34 · signal-flow: today vs yesterday medians |
| Thu Dec 10 | S35 · machine events: uptime resets, reboots into Changes |
| Fri Dec 11 | snapshot only (buffer) |
| Sat Dec 12 (light) | buffer: fix whatever broke |
| Sun Dec 13 | snapshot only |
| Mon Dec 14 | S36 · final sweep part 1: links + copy |
| Tue Dec 15 | S37 · final sweep part 2: schema + Swagger examples |
| Wed Dec 16 | S38 · v1.0 release notes draft |
| Thu Dec 17 | S39 · freeze prep: last pass, candidates tagged |
| **Fri Dec 18** | **G3 · v1.0.0 tag + release + pinned demo** |
| Dec 19 – Jan 4 | holiday freeze (cron skips; backlog note below) |

## Done

- [x] S1 v0.2 baseline · S2 design system (3 themes) · S3 scanner reliability
- [x] S4 content pass · S5 public-info hygiene · S6 themed Swagger at `/docs`
- [x] S6b docs third theme = stock Swagger Default · MIT LICENSE
- [x] T0 train infra: hygiene gate + daily-train (zero-LLM) + deploy-static

## Backlog (2027)

Auth for any non-public endpoints · multi-host compare · report.md export ·
og:image dark screenshots · lessons per-module quizzes · scanner plugin API.
