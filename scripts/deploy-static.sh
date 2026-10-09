#!/usr/bin/env bash
# Deploy the built frontend into the backend's static directory (single origin).
# Run from anywhere; paths are absolute-stable via repo root detection.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -d frontend/dist ] || { echo "deploy-static: run 'npm run build' in frontend/ first"; exit 1; }
rm -rf ./backend/static/assets
rm -f ./backend/static/index.html ./backend/static/docs.html ./backend/static/docs-theme.css
cp -r ./frontend/dist/* ./backend/static/
echo "deploy-static: ok ($(ls ./backend/static/assets/ | wc -l) asset files)"
