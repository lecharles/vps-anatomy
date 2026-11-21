#!/usr/bin/env bash
# Bundle size + gzip report: what a visitor's browser ACTUALLY receives.
# Asset names are read live from the served page — never named here — and
# each is measured twice: plain GET (wire bytes uncompressed) and a GET that
# declares Accept-Encoding: gzip (wire bytes as served). The two numbers can
# differ because compression is a server behavior, not a file property; the
# honest question is which one the browser pays.
# Output is local only. This script never writes to git.
# Usage: bash scripts/bundle-report.sh [BASE_URL]  (default http://127.0.0.1:8093)
set -uo pipefail
BASE="${1:-http://127.0.0.1:8093}"

# Budgets (gzip bytes): plain-voice ceilings for a dashboard artifact.
# Overrun is a FAIL — a report that can't say "no" is decoration.
BUDGET_JS_KB=150
BUDGET_CSS_KB=60
BUDGET_TOTAL_KB=200

page=$(curl -fsS --max-time 8 "$BASE/" 2>/dev/null) \
  || { echo "bundle-report: cannot reach $BASE — is the app running?"; exit 1; }

assets=$(echo "$page" | grep -oE '/assets/[A-Za-z0-9._-]+\.(js|css)' | sort -u)
[ -n "$assets" ] \
  || { echo "bundle-report: landing page references no /assets — is a build deployed?"; exit 1; }

kb() { awk -v b="$1" 'BEGIN{printf "%.1f", b/1024}'; }

html_bytes=${#page}
printf '%-42s %10s %10s %7s  %s\n' "asset" "raw KB" "gz KB" "saved" "compressed on the wire?"
printf '%-42s %10s %10s %7s  %s\n' "index.html (inline)" "$(kb "$html_bytes")" "-" "-" "-"

tot_raw=0; tot_gz=0; js_gz=0; css_gz=0; breach=0
for a in $assets; do
  # plain GET — no Accept-Encoding, exactly what a raw client asks for
  raw=$(curl -fsS --max-time 15 -o /dev/null -w '%{size_download}' "$BASE$a" 2>/dev/null) || raw=""
  # declared-gzip GET — body discarded, headers dumped; curl does NOT
  # decompress here, so size_download IS the wire count
  hdr=$(curl -fsS --max-time 15 -o /dev/null -D - -H 'Accept-Encoding: gzip' "$BASE$a" 2>/dev/null)
  gz=$(curl -fsS --max-time 15 -o /dev/null -w '%{size_download}' -H 'Accept-Encoding: gzip' "$BASE$a" 2>/dev/null)
  [ -n "${raw:-}" ] && [ -n "${gz:-}" ] || { echo "FAIL $a — asset not fetchable"; breach=1; continue; }
  if printf '%s' "$hdr" | tr -d '\r' | grep -qi '^content-encoding: gzip'; then
    ce="yes"
  else
    ce="NO — every visitor pays full bytes"
    gz="$raw"  # the browser really did receive the raw size
  fi
  case "$a" in *.js) js_gz=$((js_gz+gz));; *.css) css_gz=$((css_gz+gz));; esac
  tot_raw=$((tot_raw+raw)); tot_gz=$((tot_gz+gz))
  saved=$(awk -v r="$raw" -v g="$gz" 'BEGIN{if(r>0)printf "%.0f%%", 100*(1-g/r); else printf "-"}')
  printf '%-42s %10s %10s %7s  %s\n' "$a" "$(kb "$raw")" "$(kb "$gz")" "$saved" "$ce"
done

printf '%-42s %10s %10s\n' "TOTAL (first paint)" "$(kb "$tot_raw")" "$(kb "$tot_gz")"
echo
echo "budgets: JS gz < ${BUDGET_JS_KB} KB, CSS gz < ${BUDGET_CSS_KB} KB, total gz < ${BUDGET_TOTAL_KB} KB"
awk -v v="$js_gz"  -v l="$((BUDGET_JS_KB*1024))"   'BEGIN{exit !(v>l)}' && { echo "BREACH JS gz: $(kb "$js_gz") KB > ${BUDGET_JS_KB} KB"; breach=1; }
awk -v v="$css_gz" -v l="$((BUDGET_CSS_KB*1024))"  'BEGIN{exit !(v>l)}' && { echo "BREACH CSS gz: $(kb "$css_gz") KB > ${BUDGET_CSS_KB} KB"; breach=1; }
awk -v v="$tot_gz" -v l="$((BUDGET_TOTAL_KB*1024))" 'BEGIN{exit !(v>l)}' && { echo "BREACH total gz: $(kb "$tot_gz") KB > ${BUDGET_TOTAL_KB} KB"; breach=1; }

if [ "$breach" -eq 0 ]; then
  echo "bundle-report: within budget"
else
  echo "bundle-report: BUDGET BREACHED"; exit 1
fi
