#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"
LOOPS="${SELF_IMPROVE_LOOPS:-${1:-2}}"
DEPLOYMENT_READY_TARGET="${DEPLOYMENT_READY_TARGET:-95}"

if ! [[ "$LOOPS" =~ ^[0-9]+$ ]] || [[ "$LOOPS" -lt 1 ]]; then
  echo "LOOPS must be a positive integer." >&2
  exit 2
fi

for iteration in $(seq 1 "$LOOPS"); do
  echo "=== self-improve iteration ${iteration}/${LOOPS}: tests ==="
  "$PYTHON_BIN" -m pytest

  echo "=== self-improve iteration ${iteration}/${LOOPS}: full demo + validation ==="
  PYTHON_BIN="$PYTHON_BIN" bash scripts/run_demo.sh

  echo "=== self-improve iteration ${iteration}/${LOOPS}: deployment readiness >= ${DEPLOYMENT_READY_TARGET}% ==="
  "$PYTHON_BIN" -m currency_hedge_llm.cli deployment-readiness --config config/config.example.yaml --threshold "$DEPLOYMENT_READY_TARGET"
done

echo "Self-improvement loop completed ${LOOPS} clean iteration(s)."
