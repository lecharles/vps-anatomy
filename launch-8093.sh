#!/bin/bash
cd /home/hermes/vps-anatomy/backend
LOG=/tmp/vps-anatomy.log
# Bounded log: rotate at 5 MB on (re)start, keeping one previous generation.
# The log is append-only across restarts so history survives a bounce;
# rotation fires on the next start after the threshold. When the systemd
# unit (deploy/vps-anatomy.service) is enabled, this script and its log
# file retire — journald captures stdout and rotates natively.
if [ -f "$LOG" ] && [ "$(stat -c%s "$LOG" 2>/dev/null || echo 0)" -gt 5242880 ]; then
  mv -f "$LOG" "$LOG.1"
fi
python3 -m uvicorn main:app --host 0.0.0.0 --port 8093 2>&1 | tee -a "$LOG"
