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
