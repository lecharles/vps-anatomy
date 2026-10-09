# Roadmap

Work happens in slices. One slice per commit or small commit series, always
pushed. Quality bar: a page is done when a newcomer could learn from it and
a skeptic couldn't roll their eyes.

## Done

- S1 · v0.2 baseline: React+TS+FastAPI, live scanner concept, seven pages.
- S2 · Design system: adopt the VPS-wide token system (Linear-grounded dark
  by default) with Light and Academic variants; theme switch in the header.
- S3 · Scanner reliability: /proc-based facts, one shared timestamp per scan,
  service catalog, honest root-owned attribution, baseline-safe change diff.
- S4 · Content pass: real course prose, live modules, vertical data-flow
  diagram, day-grouped change feed.
- S5 · Public-info hygiene: university branding removed from repo, personal
  narration stripped from docs; README as real documentation.
- S6 · Swagger: `/docs` themed with the same tokens and theme switch;
  OpenAPI descriptions, tags, and per-endpoint summaries.

## Next

- S7 · Histogram slice: usage-style bars (per-scan service/module counts over
  time, RAM/disk trend) in the VPS-dashboard visual language.
- S8 · Resilience: systemd unit so the app survives reboots; health check;
  log rotation for /tmp scan logs.
- S9 · Test the scanner: pure functions for catalog mapping, ss parsing,
  change diffing; pytest covering the failure modes that bit v0.2.
- S10 · Reader polish: keyboard nav between lessons, prev/next, a tiny
  search across page content.
- S11 · Signal-flow animation: replay the Telegram→gateway→agent→tool→reply
  loop with the actual current latency of each hop (localhost probes).

## Backlog

- Auth for any endpoint that should not be world-readable, if the catalog
  ever grows past public facts.
- Export: `/api/machine/report.md` for pasting machine state into chats.
- Themes per URL (`?theme=`) so docs can deep-link a mode.
