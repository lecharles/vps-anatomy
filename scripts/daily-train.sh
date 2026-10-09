#!/usr/bin/env bash
# Daily smoke run — LOCAL ONLY. Zero LLM tokens, zero git writes.
# Verifies the site and API answer correctly; result goes to the host log.
# Repo cadence comes from slice work; this file guards that the site is up.
set -uo pipefail
cd "$(dirname "$0")/.."
TODAY="$(date -u +%F)"

[ -f PAUSE ] && { echo "daily: PAUSE present, skipped"; exit 0; }
MONTH_DAY="$(date -u +%m-%d)"
if [[ "$MONTH_DAY" > "12-18" || "$MONTH_DAY" < "01-05" ]]; then
  echo "daily: holiday freeze window, skipped"; exit 0
fi

if bash scripts/smoke.sh >/dev/null 2>&1; then
  echo "$(date -u '+%F %T') UTC · smoke PASS · $(curl -fsS --max-time 5 http://127.0.0.1:8093/api/services/ 2>/dev/null | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' 2>/dev/null || echo '?') listeners"
else
  echo "$(date -u '+%F %T') UTC · smoke FAIL — investigate"
  bash scripts/smoke.sh 2>&1 | tail -5 | sed 's/^/    /'
fi
