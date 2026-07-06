#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"
LOOPS="${SELF_IMPROVE_LOOPS:-${1:-2}}"

if ! [[ "$LOOPS" =~ ^[0-9]+$ ]] || [[ "$LOOPS" -lt 1 ]]; then
  echo "LOOPS must be a positive integer." >&2
  exit 2
fi

for iteration in $(seq 1 "$LOOPS"); do
  echo "=== self-improve iteration ${iteration}/${LOOPS}: tests ==="
  "$PYTHON_BIN" -m pytest

  echo "=== self-improve iteration ${iteration}/${LOOPS}: full demo + validation ==="
  PYTHON_BIN="$PYTHON_BIN" bash scripts/run_demo.sh
done

echo "Self-improvement loop completed ${LOOPS} clean iteration(s)."
