#!/usr/bin/env bash
# Boot check: is the app up AND is its scanner actually writing?
# Run after a boot, after enabling the systemd unit, or after any restart —
# /healthz answers 200 only while scan rows stay fresh, so this script's
# exit code is the post-boot proof. Usage:
#   scripts/boot-check.sh [BASE_URL] [TIMEOUT_SECONDS]
set -uo pipefail
BASE="${1:-http://127.0.0.1:8093}"
TIMEOUT="${2:-60}"
END=$((SECONDS + TIMEOUT))
last="no response"
while [ "$SECONDS" -lt "$END" ]; do
  if body=$(curl -fsS --max-time 5 "$BASE/healthz" 2>/dev/null); then
    echo "boot-check: healthy — $body"
    exit 0
  fi
  last=$(curl -s --max-time 5 "$BASE/healthz" 2>/dev/null || echo "no response")
  sleep 2
done
echo "boot-check: FAILED — $BASE/healthz not healthy within ${TIMEOUT}s (last body: ${last})"
exit 1
