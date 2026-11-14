# Commit Train Ledger

One row per calendar slice from ROADMAP.md. Statuses:

- **EVIDENCED** — the covering commit/code existed before this ledger line was
  written; commit column cites the hash(es) that prove it.
- **SHIPPED** — burned as a real slice on this train; hash recorded the same day.
- **STALLED** — audited against code and git log: not shipped, not started.
  Re-queued in calendar order (oldest first).

| Row | Slice | Status | Commit | Date PT |
|-----|-------|--------|--------|---------|
| Fri Oct 9 | train infra: hygiene gate, LICENSE, daily-train script, calendar | EVIDENCED | b6cc0f1, f41f1ea, fb7d41b | Oct 8–9 |
| Fri Oct 9 | SD1 · SVG diagram pass + plain-voice copy pass | EVIDENCED | 09509e4 | Oct 9 |
| Fri Oct 9 | SD2 · security scrub (host facts → gitignored, local-only daily-train) | EVIDENCED | bfe6c6b, 7782bd7 | Oct 9 |
| Sun Nov 8 | S7a · `/api/trends/` — hourly rollup query + schema | SHIPPED | 4a72860 | Nov 8 |
| Sun Nov 8 | S7b · trends metric params (services, modules, ram, disk) | SHIPPED | 38b73dc | Nov 8 |
| Sun Nov 8 | S7 merge · docs note, ROADMAP tick | SHIPPED | 20a0869 | Nov 8 |
| Sun Nov 8 | S8a · trend bars component — SVG, sqrt scale, value labels | SHIPPED | fc33fe4 | Nov 8 |
| Sun Nov 8 | S8b · Home + Architecture get service/module series | SHIPPED | 7fc9fb0 | Nov 8 |
| Thu Oct 15 | S8c · period toggles day/week/month (dashboard language) | SHIPPED | 0eae626 | Nov 9 |
| Fri Oct 16 | S9a · retention job: prune raw >60d, keep hourly rollups | SHIPPED | 3c914dd | Nov 9 |
| Sat Oct 17 (light) | S9b · trends endpoints documented in Swagger | SHIPPED | 5c10088 | Nov 10 |
| Sun Oct 18 (light) | S10a · systemd unit draft `vps-anatomy.service` | SHIPPED | f6a539f | Nov 10 |
| Mon Oct 19 | S10b · `/healthz` endpoint + boot check | SHIPPED (enable pending root) | f888d4d | Nov 10 |
| Tue Oct 20 | S10c · log rotation; launcher retirement stated in docs | SHIPPED (launcher drop itself pending root) | 736f997 | Nov 10 |
| Wed Oct 21 | S11a · pytest scaffolding; `ss -tlnp` fixtures | SHIPPED | 7ad47a7 | Nov 11 |
| Thu Oct 22 | S11b · catalog mapping + change-diff tests | SHIPPED | 981640c | Nov 11 |
| Fri Oct 23 | S11c · empty-DB + first-scan baseline regressions | SHIPPED | 2f155f0 | Nov 11 |
| Sat Oct 24 (light) | S12a · trends UI polish, hover detail | SHIPPED | 692e99f | Nov 11 |
| Sun Oct 25 (light) | S12b · bar labels + legend copy | SHIPPED | 6021cd9 | Nov 12 |
| Mon Oct 26 | **M1 · tag v0.4 (History + Trust complete)** | SHIPPED (tag `v0.4`; root-enable of the S10a unit remains an open host-side step) | v0.4 @ this-run ledger commit | Nov 12 |
| Wed Oct 28 | S13a · Lesson 3 rows link to live `/api/services/` data | SHIPPED | b3ca2b3 | Nov 12 |
| Thu Oct 29 | S13b · every port row cites real source or config path on disk | SHIPPED | c45d6bb | Nov 13 |
| Fri Oct 30 | S14a · localhost hop-latency probes: design + first numbers | SHIPPED | 4e4c104 | Nov 13 |
| Sat Oct 31 | S14b · Signal Flow renders measured hop ms | SHIPPED | 30673cf | Nov 14 |
| Sun Nov 1 | S14c · latency probe error states + fallback copy | SHIPPED | 4350027 | Nov 14 |
| Mon Nov 2 | S15a · "build your own scanner" guide: skeleton from `core/` | SHIPPED | dc49ff0 | Nov 14 |
| Tue Nov 3 | S15b · guide code excerpts (machine, ss, modules, diff) | SHIPPED | 5ab6579 | Nov 14 |

## Audit — Nov 8 (first ledger run)

The train stalled after `09509e4` (Oct 9). The backfill note expected Oct 10+
rows to be mostly evidenced by shipped code; a direct audit says otherwise.
Checked against `git log` (no commits after Oct 9) and the tree:

- no `backend/routers/trends.py`, no `/api/trends/` (SPA catch-all returns
  index.html for it, which initially looked like a 200 — it is not an endpoint)
- no `/healthz`, no systemd unit, no log-rotation config
- no pytest scaffolding or fixtures anywhere
- no trend-bars component in `frontend/src/components/`
- no retention/prune job in `core/`

So every October 11 → November 8 calendar row is **STALLED**, not evidenced.
The ledger does not mark them EVIDENCED because nothing covers them. (S7a was
burned as a real slice immediately after this audit, same day — see the
table above.)

### Queue (oldest unevidenced first)

S8c → S9a → S9b → S10a → S10b → S10c →
S11a → S11b → S11c → S12a → S12b → M1 → S13a → S13b → S14a → S14b → S14c →
S15a → S15b → S15c → S16a → G1 → S16b → S17a → S17b → S17c → S22 → S23 →
S24 → M2 → … (rest per ROADMAP.md)

Note: the queue runs oldest-first regardless of calendar date, so calendar
rows drift behind reality until the queue drains. M1/M2 tags fire when their
rows come up in the queue and their prerequisites are genuinely shipped.

## Run — Nov 8 (second run, backfill)

Burned four rows oldest-first (queue was ~50 behind the calendar): **S7b**
(metric params on `/api/trends/`, verified live incl. 422 on unknown
metrics), **S7 merge** (README docs note, ROADMAP ticks), **S8a** (`TrendBars`
SVG component, sqrt scale, value labels), **S8b** (24h listener series on
Home, live-residents series on Architecture; built, deployed, served).
`scripts/smoke.sh` grew trends coverage (params + validation). No new rows
marked EVIDENCED — nothing in Oct–Nov code predates this train's burns.
Queue head: **S8c** (period toggles).

## Run — Nov 10 (fourth run)

Previous run (Nov 9, 05:37–05:42 PT) burned **S8c** (`0eae626`) and **S9a**
(`3c914dd`) but did not stamp them; both verified against code before
stamping — PeriodToggle on Home + Architecture with the 720h window, and the
retention job proven in `backend/core/retention.py` wired into the scan loop,
with 376 archived hours already in `trend_hours` on the host (DB is
gitignored; not committed). Queue head advanced to **S9b**, whose work was
found prepared but uncommitted in the working tree (Swagger response docs
for `/api/trends/`) — audited this run: example payload is synthetic (12
listeners / 7.4 GB), not a mirror of live host facts; safe to commit.

Burned four rows oldest-first, queue ~25 calendar rows behind today: **S9b**
(`5c10088`, trends Swagger docs — served examples + 422 contract verified in
the live schema), **S10a** (`f6a539f`, `deploy/vps-anatomy.service` unit
draft, parses under `systemd-analyze verify`), **S10b** (`f888d4d`, `/healthz`
— 200 fresh / 503 stale / 503 no-scans, all three states exercised;
`scripts/boot-check.sh` as the post-boot proof; smoke covers it, one fixup
commit `827989d` after the check's JSON spacing failed its own gate),
**S10c** (`736f997`, launcher log rotation at 5 MB with append across
restarts — rotation block proven on a sandboxed oversized log; README Run
section states the systemd target and the launcher's retirement plan).

Pending root (honest, not skipped): this host grants no passwordless sudo,
so the unit **install/enable** step and the literal launcher retirement
cannot be executed by the train. They need one interactive root session;
until then the app runs under `launch-8093.sh` in its multiplexer session
and `boot-check` guards restarts. Queue head: **S11a** (pytest scaffolding —
no host privileges needed, safe for the next run).

## Run — Nov 12 (fifth + sixth runs; ledger back-stamp, S12b, M1)

The Nov 11 run burned S11a–S11c + S12a (`7ad47a7`, `981640c`, `2f155f0`,
`692e99f`) but exited before stamping the ledger; its edits were found
uncommitted. This run re-ran the suite (30 green) and code-verified the
hover/legend claims in `TrendBars.tsx` before stamping those four rows
(`2db1d49`).

Burned two rows oldest-first, queue still ~2.5 calendar weeks behind:
**S12b** (`6021cd9`, legend copy + density-surviving ceiling label —
built via `npm run build`, deployed into the served bundle), then **M1**:
tag **v0.4** — the repo's first tag — anchoring History (S7→S12) and Trust
(S10, S11) as complete in code, with the standing caveat that enabling the
systemd unit still awaits one interactive root session. Queue head:
**S13a** (Lesson 3 rows link to live `/api/services/` data).

## Run — Nov 14 (eighth run; stamp S13b/S14a, burn S14b → S15b)

The Nov 13 run burned **S13b** (`c45d6bb`) and **S14a** (`4e4c104`) but
exited before stamping them; both audited against code this run before
stamping — S13b: live per-request citation resolution in
`backend/core/config_citation.py` + services router, `config: Optional[str]`
in schema, 'no config on disk' fallback rendered in Home; S14a: 3-probe
200ms-capped median probes in `backend/core/latency.py`, `/api/latency/` +
history endpoints, `latency_samples` in the prune set, 45-test suite re-run
green, live endpoints answering.

Queue head **S14b** (Oct 31, light): Signal Flow renders the measured hop ms
per resident instead of promising 'local'. ~2 weeks behind today's calendar
row (M2 · v0.5), so this run burns oldest-first: **S14b → S14c → S15a →
S15b** (four real slices, max allowed).

Outcome (same run): all four burned — **S14b** (`30673cf`, measured-hop
strip + per-port rows joined at read time from `/api/services/`, dashboard
times itself via `window.location.port`, zero host facts in code),
**S14c** (`4350027`, exhaustive five-state hop meter: unreachable /
loading / no-block / no-answer / ok, unanswered probes stay visible as
stated gaps, block staleness reads as 'block from Xm ago'), **S15a**
(`dc49ff0`, `/guide` page: project skeleton + the five questions + the
three-rule contract, nav/route/smoke wired), **S15b** (`5ab6579`, four
real trimmed excerpts from `core/__init__.py`: machine, sockets,
residents, diff — shortened, never rewritten). Suite 45 green, smoke
20/20, home 200, hygiene clean at every commit. Queue head: **S15c**
(guide review + linked from Lesson 3), then S16a → G1 → S16b → S17a–c →
S22 → S23 → S24 → M2 (queue now ~11 calendar rows behind).
