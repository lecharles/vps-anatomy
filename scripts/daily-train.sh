#!/usr/bin/env bash
# Daily public snapshot: pulls the live API into a JSON file and commits it.
# No LLM involved — this runs from the system crontab. Zero tokens by design.
#
# What ships daily: data/snapshots/YYYY-MM-DD.json with machine facts, the
# service census, module status, and change counts. This is the same data the
# site already serves publicly; committing it gives the repo a factual,
# append-only history of the machine.
#
# Pause: create PAUSE at repo root. Holiday freeze: Dec 19 - Jan 4.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="$(pwd)"
TODAY="$(date -u +%F)"
MONTH_DAY="$(date -u +%m-%d)"

# Holiday freeze (Dec 19 through Jan 4)
if [ "$MONTH_DAY" \> "12-18" ] || [ "$MONTH_DAY" \< "01-05" ]; then
  echo "daily-train: holiday freeze window, skipping"
  exit 0
fi
[ -f PAUSE ] && { echo "daily-train: PAUSE present, skipping"; exit 0; }

API="${VPS_ANATOMY_API:-http://127.0.0.1:8093}"

machine=$(curl -fsS --max-time 10 "$API/api/machine/") || { echo "daily-train: API unreachable (machine)"; exit 1; }
services=$(curl -fsS --max-time 10 "$API/api/services/")
modules=$(curl -fsS --max-time 10 "$API/api/modules/")
changes=$(curl -fsS --max-time 10 "$API/api/changes/?limit=1000")

mkdir -p data/snapshots
out="data/snapshots/$TODAY.json"
python3 - "$out" "$machine" "$services" "$modules" "$changes" <<'PY'
import json, sys
out, machine, services, modules, changes = sys.argv[1:6]
m = json.loads(machine); sv = json.loads(services); mo = json.loads(modules); ch = json.loads(changes)
doc = {
  "date": out.split("/")[-1].replace(".json", ""),
  "machine": {k: m[k] for k in ("hostname","os","arch","cpus","ram_gb","disk_total_gb","disk_used_gb","uptime_days","ip_public")},
  "services": {"count": len(sv), "public": sum(1 for s in sv if s.get("public")), "listeners": sorted(({"port": s["port"], "name": s["name"], "public": bool(s.get("public"))} for s in sv), key=lambda x: x["port"])},
  "modules": [{"id": x["module_id"], "name": x["name"], "status": x["status"]} for x in mo],
  "changes_recent": {"count": len(ch), "types": {}},
}
for c in ch:
    types = doc["changes_recent"]["types"]
    types[c["change_type"]] = types.get(c["change_type"], 0) + 1
open(out, "w").write(json.dumps(doc, indent=2) + "\n")
PY

# Hygiene before any commit
bash scripts/hygiene.sh >/dev/null || { echo "daily-train: hygiene failed, aborting without commit"; exit 1; }

git pull --ff-only --quiet 2>/dev/null || git pull --rebase --quiet || true
git add "data/snapshots/$TODAY.json"
if git diff --cached --quiet; then
  echo "daily-train: snapshot unchanged, nothing to commit"
  exit 0
fi
git commit -q -m "data: daily snapshot $TODAY"
git push origin main
echo "daily-train: pushed data/snapshots/$TODAY.json"
