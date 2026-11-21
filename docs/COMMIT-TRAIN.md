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
| Wed Nov 4 | S15c · guide review + linked from Lesson 3 | SHIPPED | 1d733a8 | Nov 15 |
| Thu Nov 5 | S16a · Changes feed filter chips (type · entity) | SHIPPED | 818ce6c | Nov 15 |
| Fri Nov 6 | **G1 · Trust soak checkpoint** | HELD — not burnable: unit enable awaits root; test suite age 5d < 2wk as of Nov 16 | — | Nov 15 |
| Sat Nov 7 (light) | S16b · change events link to affected module pages | SHIPPED | 441a10b | Nov 15 |
| Sun Nov 8 (light) | S17a · contrast audit: tokens vs AA in all three themes | SHIPPED | d8307c0 | Nov 15 |
| Mon Nov 9 | S17b · focus rings + keyboard nav between lessons | SHIPPED | 23f3254 | Nov 16 |
| Tue Nov 10 | S17c · reader semantics pass (headings, landmarks) | SHIPPED | 48ce3b6 | Nov 16 |
| Wed Nov 11 | S22 · Lesson 5 refresh with probe + trends data cited | SHIPPED | 5e7a4e6 | Nov 16 |
| Thu Nov 12 | S23 · Architecture tier live counts (services/modules per tier) | SHIPPED | 44f3bb0 | Nov 16 |
| Fri Nov 13 | S24 · module detail mini-sparkline per resident | SHIPPED | 2644a73 | Nov 17 |
| Sat Nov 14 (light) | **M2 · tag v0.5 (Trust complete)** | HELD — same halves as G1: suite is 6 days old (needs 14), systemd enable still awaits one interactive root session; fires when they're true | — | Nov 17 |
| Mon Nov 16 | S25 · docs audit: README claims vs behavior, fix deltas | SHIPPED | ff009d2 | Nov 17 |
| Tue Nov 17 | S26 · OpenAPI cleanup: examples per endpoint | SHIPPED | e27fd2c | Nov 17 |
| Wed Nov 18 | S27 · trends CSV export endpoint | SHIPPED | 076aa2e | Nov 18 |
| Thu Nov 19 | S28 · tiny client-side lesson search | SHIPPED | 93f5c3b | Nov 19 |
| Fri Nov 20 | S29 · prev/next lesson navigation | SHIPPED (burned early, Nov 19) | 48f375f | Nov 19 |
| Sat Nov 21 | S30 · `?theme=` deep-link shared by site + docs | SHIPPED (burned early, Nov 20) | 302d380 | Nov 20 |
| Mon Nov 23 | S31 · bundle size + gzip report; first optimization | SHIPPED (burned early, Nov 21) | e3a2e4c | Nov 21 |

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

## Run — Nov 15 (ninth run; burn S15c → S17a, G1 held honestly)

Queue head **S15c**, ~11 calendar rows behind today (Nov 15 = soak/buffer).
Burned four rows oldest-first and skipped nothing else: **S15c**
(`1d733a8`, guide review — caught three copy lies against the shipped
file: "under 400 lines" was 413; an annotation comment in the machine
excerpt existed nowhere in `core/__init__.py`, breaking the page's own
"never rewritten" promise; step 4 advertised reboot/uptime diffing that
`detect_changes()` deliberately does not do until S35 — all excerpts now
verbatim trims; Lesson 3 takeaway links `/guide`), **S16a** (`818ce6c`,
two-axis filter chips on the Changes feed — type · entity, buttons with
aria-pressed, chips derived from values the feed actually holds, 24h
pills intentionally unfiltered), **S16b** (`441a10b`, resident events now
link to `/modules/<id>`; listener events stay plain — no page, no link),
**S17a** (`d8307c0`, WCAG AA audit across all three themes: nine failing
pairs fixed at the token level, two tempting "fixes" refused because the
measured value passed — academic danger 4.79, academic purple 5.90;
method + before/after table in docs/CONTRAST-AUDIT.md, automated version
queued as S32).

**G1 (Nov 6) is HELD, not burned.** Its terms are "2 weeks of systemd +
tests holding" — neither half is true yet: the S10a unit still awaits one
interactive root session to enable (this host grants no passwordless
sudo), and the pytest suite turned 4 days old on Nov 15. Writing a
"checkpoint passed" commit would have been the exact fake the train
rules forbid, so the gate stays open in the queue and the soak clock is
recorded here instead: scanner continuously recording through 506
archived hours, healthz ok at 24.6s staleness, tmux session up since
Nov 13, suite 45 green, smoke 20/20 before and after every slice this
run. G1 fires either when root enables the unit + 2 weeks pass, or is
downgraded by Carlos to "tests-only soak" once the suite reaches 14 days
(Nov 25).

Queue head after this run: **S17b** (focus rings + keyboard nav), then
S17c → S22 → S23 → S24 → M2 (G1 held) — queue ~10 calendar rows behind.

## Run — Nov 16 (tenth run; burn S17b → S17c → S22 → S23)

Queue head **S17b** (Nov 9), ~10 calendar rows behind today (Nov 16 =
S25's row). Burned four real slices oldest-first. Pre-burn audit: none
of the four had covering code — no `:focus-visible` anywhere in the
tree, top bar was a div, Modules cards jumped h1→h3, Lesson 5 quoted
only adjectives, Architecture tiers counted nothing — so no new rows
were marked EVIDENCED; all four burned as genuine work:

- **S17b** (`23f3254`): one `:focus-visible` ring for the whole app on
  the AA-cleared primary-bright token; lesson articles became tab
  stops with arrow/Home/End roving focus (the article only eats a key
  when it itself holds focus), hint line in the page head.
- **S17c** (`48ce3b6`): header/nav[Primary]/main/footer landmarks,
  skip link as first tab stop, Modules cards h3→h2, Changes day
  labels + both Signal Flow labels + Data Flow and Guide section
  labels promoted from styled divs to h2.eyebrow, lesson articles
  bound aria-labelledby to their headings.
- **S22** (`5e7a4e6`): Lesson 5 cites the live probe block
  (/api/latency/ — median + slowest answered hop, N of M probes) and
  the 24h listener record (/api/trends/), with steady/moving/vacuum
  copy branches and stated gaps; a first-draft static "sub-
  millisecond" claim was killed in review before commit.
- **S23** (`44f3bb0`): per-tier right-aligned counts computed only
  from measurable nodes ('N of 3 measured live'; unmeasured members
  excluded from the denominator; Storage states nothing); two pending-
  poll red dots eliminated — undefined live means no dot, no claim.
  Tallies hand-verified against the live API before commit.

**G1 still HELD**: suite is 5 days old (needs 14), systemd enable
still awaits one interactive root session. Soak clock: scanner
continuous, 530 full archived hours, smoke 20/20 and hygiene clean at
every commit this run (4 slices + this ledger stamp).

**Housekeeping**: AGENTS.md (host-local agent directives, carries
personal names — must never enter public history) was found untracked
and is now gitignored; it is not and will not be committed.

Queue head after this run: **S24** (Nov 13), then M2 — whose
prerequisites (Trust complete) are the same halves G1 is holding, so
M2 will be evaluated in queue order and held unless genuinely ready.
After M2's slot: S25 (Nov 16's row), then the light Nov 17 row S26.
Queue ~3 calendar rows behind; next run burns S24 → M2-evaluation →
S25 and reaches the current date, then ships that day's row + 1–2
light items per run.

## Run — Nov 17 (eleventh run; burn S24 → S25 → S26 — queue caught the calendar)

Queue head was **S24** (Nov 13), ~3 calendar rows behind. Burned in queue
order — **S24** (`2644a73`), M2-evaluation (**HELD**, below), **S25**
(`ff009d2`), **S26** (`e27fd2c`, today's row) — three real slices plus
this stamp, and for the first time since the stall the queue has reached
the current date. No new rows marked EVIDENCED: the pre-burn audit found
no covering code for S24–S26 (ModuleDetail had no time series, the
README's "five endpoints" claim was stale, twelve of fourteen operations
had no example), and everything evidenced through S23 is already stamped.

- **S24**: `/api/modules/{id}/sparkline` (hourly scans-vs-live buckets,
  unprobed hours absent, 422 on bad windows) + a mini-sparkline on every
  resident page — bar height = live share of the hour, red stub = whole
  hour down, faint tick = gap in the record. Six new regression tests
  (suite 45 → 51).
- **S25**: README audited against shipped behavior; five deltas fixed —
  the scanner's read list (cores/RAM-totals/disk-usage, not "CPU"),
  endpoint count (five → eight, including S24's), two undocumented live
  endpoints, two missing `core/` files in the layout tree, and the
  hand-rolled rebuild snippet replaced by `scripts/deploy-static.sh`.
  Also stated plainly: the machine row carries the host's own hostname
  and public IP at runtime, which is exactly why they never appear in
  committed content.
- **S26**: examples on all 14 operations, each shaped against the real
  code (a paraphrased change-event description was corrected against
  `detect_changes` in review); healthz documents both 503 flavors; the
  version string 0.3.0 → 0.4.0, single-sourced so `/api` and the schema
  can't drift. Smoke grew two checks (22/22): an example marker and the
  sparkline route — the resident id is read live inside the script,
  never named in it.

**M2 HELD, honestly.** Its terms are "Trust complete" — the same two
halves G1 holds: the pytest suite turned 6 days old on Nov 17 (needs 14)
and the S10a unit is still `not-found` under systemd (enable awaits one
interactive root session; this host grants no passwordless sudo). v0.5
gets tagged when those are true — earliest Nov 25, the same date as the
G1 tests-only decision.

**Ops note for future runs:** the app's multiplexer session runs the
launcher as the pane's command — a `C-c` stops uvicorn *and* takes the
pane with it, so a backend restart means recreating the detached
session pointed at `launch-8093.sh`, not re-sending the command.
Encountered and recovered cleanly this run; scanner writing within
seconds, healthz ok.

**Gates**: hygiene clean and smoke green (20/20 → 22/22) at every
commit; suite 51 passed; home 200; uvicorn restarted after the backend
slices; frontend built via `npm run build` and deployed for S24 only
(S25/S26 touched no frontend source).

Queue head after this run: **S27** (Wed Nov 18, trends CSV export —
backend-only, safe without root), then S28–S30, S31–S33, G2 (Nov 27).
From here the train runs at cadence: one day's row per run, light rows
kept light; G1/M2 re-evaluated daily and fire on their evidence,
earliest Nov 25.

## Run — Nov 18 (twelfth run; cadence day one — ship the row, keep it honest)

Queue head was **S27** (Wed Nov 18) — the first run at calendar cadence,
no backfill owed. Burned the row as one real slice (**S27**, `076aa2e`),
plus a one-line honest touch in this commit (the schema blurb's `trends`
bullet now names the CSV face; a description that omits a just-shipped
format is the drift S25 audited out of the README). No new rows marked
EVIDENCED: the pre-burn audit found no covering code for S27 before
today, and everything through S26 is already stamped.

- **S27**: `/api/trends/export` — the hourly rollup as a `text/csv`
  attachment. One computation, two serializations: JSON and CSV routes
  call the same `_rollup` (body moved out of `get_trends` untouched),
  so a chart and a downloaded file cannot disagree. Canonical column
  order from `SELECTABLE` (byte-identical files for identical queries);
  unselected metric = no column; unrecorded value = empty field, never
  a fake zero; empty window = header-only file. 422 validation
  inherited — errors answer JSON, never a bad CSV. Six regression tests
  pin the mirror contract (suite 51 → 57); smoke grows two checks
  (22 → 24): export body + export 422. README API table grew its row.

**M2 stays HELD, honestly**: suite is 7 days old (needs 14; earliest
tag Nov 25) and `vps-anatomy.service` is still `not-found` under
systemd — enable awaits one interactive root session, re-checked this
run. G1 likewise held on the same evidence.

**Gates**: hygiene clean at both commits; backend restarted via a
recreated detached `8093` session (launcher-pane mechanics, per the
Nov 17 ops note) — scanner writing within seconds, healthz ok; smoke
24/24 twice (after restart, and after the ledger commit's main.py
touch); home 200; suite 57 green. No frontend source changed — no
build, none needed.

Queue head after this run: **S28** (Thu Nov 19, tiny client-side
lesson search — frontend, `npm run build` + deploy-static), then S29
(Nov 20), S30 (Nov 21, light), buffer Nov 22, S31–S33, G2 Nov 27.

## Run — Nov 19 (thirteenth run; burn S28 → S29, one day ahead of the calendar)

Queue head was **S28** (today's row). Burned it, then the light row
behind it — **S29** (Nov 20) — as the day's bonus, keeping the run at
cadence-plus-one: **S28** (`93f5c3b`), **S29** (`48f375f`), plus this
stamp. No new rows marked EVIDENCED: the pre-burn audit found no
covering code for either (Lessons.tsx had no input, no prev/next rows).

- **S28**: the course page's search filters the six lesson articles by
  their own rendered text — the index IS the page, read from the same
  card refs the keyboard nav uses, so there is no corpus to maintain and
  the live numbers the lessons quote are themselves findable. Count in
  a polite live region; zero matches is a stated answer (no-hits panel
  names what the course covers + a clear button); Escape clears; the
  S17b arrows now walk the visible set so a filtered page can't
  dead-jump to a hidden article.
- **S29**: every lesson ends with prev/next links + a position count —
  the visible face of the arrow-key nav, equally search-aware: neighbors
  are neighbors-among-the-shown and the counter reads against the match
  set ('2 of 4' under a search, never a stale 'of 6'). Real `#lesson-N`
  hrefs; `<nav aria-label>` per row; lesson names shared with S28's
  no-hits copy via ONE `LESSON_NAMES` line.

**Ledger fix folded into this stamp:** the Nov 18 run's stamp
(`e33f53d`) said it stamped S27 — and the ROADMAP tick proves the burn —
but the S27 row never actually entered the table above. It is in now
(`076aa2e`, Nov 18), with S28/S29 behind it: the table once again
matches the log.

**M2/G1 stay HELD, honestly**: re-checked this run — the pytest suite is
8 days old (started Nov 11 with S11a; needs 14), and
`systemctl is-enabled vps-anatomy.service` still answers `not-found`
(enable awaits one interactive root session). Earliest fire: Nov 25.

**Gates**: hygiene clean at all three commits; both slices frontend-only
— no backend touched, no uvicorn restart (none needed; healthz stayed
ok); `npm run build` + `scripts/deploy-static.sh` per slice; smoke
24 → 25 → 26 green; home + /lessons 200; suite 57 green (one
test_latency flake on the first run — a race with the live scanner;
passed in isolation and on re-run twice). One smoke re-run needed after
S29's deploy: the check raced the assets directory's rm-and-replace, a
transient of the deploy script's own window, not a code fault — noted
for future runs.

Queue head after this run: **S30** (Sat Nov 21, light — `?theme=`
deep-link shared by site + docs), then buffer Nov 22, S31 (Nov 23),
S32, S33, G2 · v0.6 (Nov 27). The train now runs one day AHEAD of the
calendar; keep the surplus at one row — burn S30 tomorrow, or hold it
if S30 turns out to need the docs page and a careful eye.

## Run — Nov 20 (fourteenth run; burn S30 early, surplus kept at one row)

Queue head was **S30** (Sat Nov 21) — today's own row (S29) had been
burned yesterday as the cadence-plus-one bonus, so this run burned the
next light row to keep the surplus at exactly one: **S30** (`302d380`),
plus this stamp. No new rows marked EVIDENCED — the pre-burn audit
found no covering code (no `?theme=` reader anywhere in useTheme.ts or
docs.html), and everything through S29 is stamped.

- **S30**: `?theme=<name>` deep-links both surfaces under one contract —
  URL wins over the saved choice; each page accepts only values it can
  draw; the address bar is rewritten whenever a visible param names a
  look the page isn't painting (docs has no academic mirror since S6b —
  it lands and says vps, never a silent promise broken). Toggle writes
  the param via replaceState; deep links persist into the shared
  `vps.theme` key, plain visits write nothing (a side-tab docs open
  can't clobber an app visitor's saved choice — caught in review, the
  first draft wrote the normalized fallback unconditionally). Reads are
  single-sourced on each face: ONE `currentTheme()` behind main.tsx's
  pre-paint call and the toggle's hook; ONE `pickDocsTheme()` behind the
  docs pre-paint pass and its buttons. Smoke grows two checks (26 →
  28), one per face, the hashed bundle read live as ever.

**Review lesson kept for future runs**: the first smoke pattern pinned
double quotes (`searchParams.set("theme")`) and FAILED against the
served bundle — esbuild emits backtick literals. The pattern now
accepts either quote style. Pin string-greps to bytes actually served,
not to the source's quote style.

**M2/G1 stay HELD, honestly**: re-checked this run — the suite is 9
days old (started Nov 11 with S11a; needs 14) and
`systemctl is-enabled vps-anatomy.service` still answers `not-found`
(enable awaits one interactive root session). Earliest fire: Nov 25.

**Gates**: hygiene clean at both commits; pure-static run — no python
touched, no uvicorn restart (docs.html is a FileResponse re-read per
request; the new bundle went live through deploy-static, verified by
served-bytes checks); `npm run build` clean (tsc -b); smoke 27/1 →
fixed → 28/28 green; home and /docs 200 (incl. `?theme=` variants);
suite 57 green.

Queue head after this run: buffer (Sun Nov 22 — nothing to burn, but
the run still owes its daily push: S31 is the next real row), then
S31 (Mon Nov 23, bundle-size + gzip report + first optimization —
NOTE: the optimization must keep the smoke's live-read asset grep
working), S32, S33, G2 · v0.6 (Nov 27). The train stays one day AHEAD;
burning S31 tomorrow keeps the machine moving without widening the
surplus past one row after Nov 22's buffer.

## Run — Nov 21 (fifteenth run; burn S31 early — the buffer-before-Monday plan as written)

Queue head was **S31** (Mon Nov 23). Today's own calendar row (S30) had been
burned Nov 20, and the Nov 20 note's plan was explicit — burn S31 tomorrow so
the train keeps moving through the Sun Nov 22 buffer without widening the
surplus afterward. Burned it as one real slice (**S31**, `e3a2e4c`), plus this
stamp. No new rows marked EVIDENCED: the pre-burn audit searched `scripts/`
for any size/gzip tooling and found none — nothing predated the burn.

- **S31**: two halves, one complaint. The report (`scripts/bundle-report.sh`)
  measures what the browser ACTUALLY receives: asset names read live from the
  served page, each fetched plain and again with a gzip declaration, curl
  never told to decompress so the download count is the wire count — and an
  uncompressed response is booked at its raw size, refusing to advertise a
  ratio no visitor got. Budgets (JS/CSS/total gz) make it pass/fail, not
  decoration. The optimization is the server honoring the offer: GZip on the
  app (minimum_size 1024). Before/after, same script, same live server:
  **318.4 KB → 98.7 KB first paint; the JS 300.9 → 94.6 (-69%), the CSS 17.4
  → 4.1 (-77%)**. Smoke grows one check (28 → 29): the live-read bundle must
  arrive smaller under a gzip offer than without it — byte comparison, no
  header parsing, no named assets. The standing grep checks needed no
  changes: clients that declare nothing still get plain bytes.

**M2/G1 stay HELD, honestly**: re-checked this run — the suite is 10 days old
(started Nov 11 with S11a; needs 14) and `systemctl is-enabled
vps-anatomy.service` still answers `not-found` (enable awaits one interactive
root session). Earliest fire: Nov 25 — the same day the queue reaches S33, so
the Nov 25 run carries a gate decision plus a slice.

**Gates**: hygiene clean at both commits; backend changed — restarted via a
recreated detached `8093` session (launcher-pane mechanics, per the Nov 17
ops note), scanner writing 2.3s after start; smoke 29/29; home 200 (and
docs/openapi 200 inside the suite of checks); suite 57 green; bundle-report
within budget post-restart. Frontend source untouched — no build.

Queue head after this run: **S32** (Tue Nov 24, automated a11y check — the
S17a audit's method, scripted; it can read the token table from CSS, no
browser needed, zero tokens). Sun Nov 22 is a calendar buffer: the daily push
is still owed, and the honest light work there is a soak-and-audit stamp —
re-run the gates, re-check M2/G1, record the clock; no invented busywork.
Then S32, S33 (Nov 25, mobile layout pass), the M2/G1 decision (Nov 25), G2 ·
v0.6 (Nov 27).
