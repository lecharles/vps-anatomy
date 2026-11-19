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
check "healthz"            "$BASE/healthz"     '"status": *"ok"'
check "docs page"          "$BASE/docs"        'swagger'
check "openapi"            "$BASE/openapi.json" '"openapi"'
check "api machine"        "$BASE/api/machine/" '"hostname"'
check "api services"       "$BASE/api/services/" '"port"'
check "api services citations" "$BASE/api/services/" '"config"'
check "api latency"        "$BASE/api/latency/" '"connect_ms"'
check "api modules"        "$BASE/api/modules/" '"module_id"'
check "api changes"        "$BASE/api/changes/" '\[|\]'
check "api trends"         "$BASE/api/trends/?hours=2&metrics=services,modules,ram,disk" '"hour"'
check "api trends metric"  "$BASE/api/trends/?hours=2&metrics=ram" '"ram_gb_avg"'
check "api trends month"   "$BASE/api/trends/?hours=720&metrics=services" '"hour"'
check "api trends csv (S27)" "$BASE/api/trends/export?hours=2&metrics=services,ram" '^hour,scans,services_listening,ram_gb_avg'
check "trends swagger docs" "$BASE/openapi.json" 'Dashboard convention'
check "openapi examples (S26)" "$BASE/openapi.json" 'anatomy-demo'
check "lessons route"      "$BASE/lessons"     '<div id="root"'
check "data-flow route"    "$BASE/data-flow"   '<div id="root"'
check "guide route"        "$BASE/guide"       '<div id="root"'

# sparkline must answer for a real resident — id read live, never named here (S24)
first_mod=$(curl -fsS --max-time 5 "$BASE/api/modules/" 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d[0]["module_id"] if d else "")' 2>/dev/null || echo "")
if [ -n "$first_mod" ]; then
  check "api module sparkline" "$BASE/api/modules/$first_mod/sparkline?hours=24" '"hour".*"scans".*"live"'
else
  echo "FAIL api module sparkline (no residents to ask)"; fail=$((fail+1))
fi

# trends must reject unknown metrics rather than quietly return nothing
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/trends/?metrics=bogus" --max-time 5)
if [ "$code" = "422" ]; then echo "PASS trends metric validation (422)"; pass=$((pass+1));
else echo "FAIL trends metric validation (got $code, want 422)"; fail=$((fail+1)); fi

# the CSV face must inherit the same validation — JSON error, never a bad file
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/trends/export?metrics=bogus" --max-time 5)
if [ "$code" = "422" ]; then echo "PASS trends csv validation (422)"; pass=$((pass+1));
else echo "FAIL trends csv validation (got $code, want 422)"; fail=$((fail+1)); fi

# the lesson search box (S28) must be in the served bundle — asset name
# is hashed, so it is read live from the page, never named here
bundle=$(curl -fsS --max-time 5 "$BASE/" 2>/dev/null | grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [ -n "$bundle" ] && curl -fsS --max-time 8 "$BASE$bundle" 2>/dev/null | grep -q 'lesson-q'; then
  echo "PASS lesson search shipped (bundle carries the input)"; pass=$((pass+1))
else
  echo "FAIL lesson search shipped (no bundle or no input in it)"; fail=$((fail+1))
fi

# the lesson prev/next rows (S29) must be in the same served bundle
if [ -n "$bundle" ] && curl -fsS --max-time 8 "$BASE$bundle" 2>/dev/null | grep -q 'lesson-nav'; then
  echo "PASS lesson nav shipped (bundle carries prev/next)"; pass=$((pass+1))
else
  echo "FAIL lesson nav shipped (no bundle or no nav in it)"; fail=$((fail+1))
fi

# sanity: a scan must have happened
n=$(curl -fsS --max-time 5 "$BASE/api/services/" 2>/dev/null | python3 -c 'import json,sys; print(len(json.load(sys.stdin)))' 2>/dev/null || echo 0)
if [ "${n:-0}" -gt 0 ]; then echo "PASS scanner fresh ($n listeners recorded)"; pass=$((pass+1));
else echo "FAIL scanner stale (0 listeners — scan loop down?)"; fail=$((fail+1)); fi

# retention must have archived at least one closed hour
arch=$(curl -fsS --max-time 5 "$BASE/api/trends/?hours=720&metrics=services,modules,ram,disk" 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len([b for b in d if all(b.get(k) is not None for k in ("scans","services_listening","modules_live","ram_gb_avg","disk_used_gb_avg"))]))' 2>/dev/null || echo 0)
if [ "${arch:-0}" -gt 0 ]; then echo "PASS trends archive populated ($arch full hours)"; pass=$((pass+1));
else echo "FAIL trends archive empty (retention job not running?)"; fail=$((fail+1)); fi

echo "smoke: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
