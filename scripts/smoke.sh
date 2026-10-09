#!/usr/bin/env bash
# Smoke test: does the app answer like itself? Generic — no host facts.
# Usage: bash scripts/smoke.sh [BASE_URL]   (default http://127.0.0.1:8093)
set -uo pipefail
BASE="${1:-http://127.0.0.1:8093}"
pass=0; fail=0

check() { # name, url, predicate(on body)
  local name="$1" url="$2" pred="${3:-}"
  local body code
  body=$(curl -fsS --max-time 8 "$url" 2>/dev/null) && code=0 || code=1
  if [ $code -ne 0 ]; then echo "FAIL $name (no response)"; fail=$((fail+1)); return; fi
  if [ -n "$pred" ] && ! echo "$body" | head -c 200000 | grep -qE "$pred"; then
    echo "FAIL $name (body missing: $pred)"; fail=$((fail+1)); return
  fi
  echo "PASS $name"; pass=$((pass+1))
}

check "home page"          "$BASE/"            '<div id="root"'
check "docs page"          "$BASE/docs"        'swagger'
check "openapi"            "$BASE/openapi.json" '"openapi"'
check "api machine"        "$BASE/api/machine/" '"hostname"'
check "api services"       "$BASE/api/services/" '"port"'
check "api modules"        "$BASE/api/modules/" '"module_id"'
check "api changes"        "$BASE/api/changes/" '\[|\]'
check "lessons route"      "$BASE/lessons"     '<div id="root"'
check "data-flow route"    "$BASE/data-flow"   '<div id="root"'

# sanity: a scan must have happened
n=$(curl -fsS --max-time 5 "$BASE/api/services/" 2>/dev/null | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' 2>/dev/null || echo 0)
if [ "${n:-0}" -gt 0 ]; then echo "PASS scanner fresh ($n listeners recorded)"; pass=$((pass+1));
else echo "FAIL scanner stale (0 listeners — scan loop down?)"; fail=$((fail+1)); fi

echo "smoke: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
