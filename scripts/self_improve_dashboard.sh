#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

LOOPS="${DASHBOARD_LOOPS:-${1:-2}}"
TARGET="${DASHBOARD_QUALITY_TARGET:-95}"

if ! [[ "$LOOPS" =~ ^[0-9]+$ ]] || [[ "$LOOPS" -lt 1 ]]; then
  echo "LOOPS must be a positive integer." >&2
  exit 2
fi

for iteration in $(seq 1 "$LOOPS"); do
  echo "=== BR3N dashboard loop ${iteration}/${LOOPS}: lint ==="
  npm run lint

  echo "=== BR3N dashboard loop ${iteration}/${LOOPS}: build ==="
  npm run build

  echo "=== BR3N dashboard loop ${iteration}/${LOOPS}: quality >= ${TARGET}% ==="
  DASHBOARD_QUALITY_TARGET="$TARGET" npm run quality:dashboard
done

echo "BR3N dashboard self-improvement loop completed ${LOOPS} clean iteration(s)."
