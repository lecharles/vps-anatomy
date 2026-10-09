#!/usr/bin/env bash
# Public-artifact hygiene check. Run after staging, before pushing; CI runs
# it on every push. Exits non-zero on any finding.
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
report() { echo "HYGIENE FAIL: $1"; fail=1; }

# 1. No secrets-like strings in source (minified bundles excluded).
if git grep --cached -nIE 'sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{20,}|xox[bap]-[A-Za-z0-9-]{10,}|BEGIN [A-Z ]*PRIVATE KEY' -- ':!backend/static' 2>/dev/null | grep -v 'scripts/hygiene'; then
  report "secret-like token found in tracked files"
fi

# 2. No private working files tracked.
for pat in '\.env$' '\.db$' 'handoff' '_local'; do
  hits=$(git ls-files | grep -iE "$pat" || true)
  [ -n "$hits" ] && report "private file tracked: $hits"
done

# 3. No brand claims or personal narration in tracked copy.
#    (useTheme.ts keeps 'stanford' only as a localStorage migration — exempt.)
if git grep --cached -niE 'stanford' -- ':!backend/static' ':!frontend/src/hooks/useTheme.ts' ':!frontend/public/docs.html' ':!backend/static_serve*' 2>/dev/null | grep -v 'scripts/hygiene'; then
  report "university brand name in tracked files"
fi
if git grep --cached -nE 'Built by .* for [A-Z]|vision statement' -- '*.md' '*.tsx' '*.py' '*.html' 2>/dev/null | grep -v 'scripts/hygiene'; then
  report "personal narration in tracked files"
fi

# 4. Emails (except example.com) in tracked text.
if git grep --cached -inE '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' -- '*.md' '*.py' '*.tsx' '*.ts' 2>/dev/null | grep -v 'example\.com' | grep -v 'scripts/hygiene'; then
  report "email address in tracked files"
fi

if [ "$fail" -eq 0 ]; then echo "hygiene: clean"; fi
exit $fail
