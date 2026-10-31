#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

LOOPS="${ALL_PROJECT_SELF_IMPROVE_LOOPS:-${1:-1}}"
CONTINUOUS="${ALL_PROJECT_CONTINUOUS:-false}"
DASHBOARD_LOOPS="${DASHBOARD_LOOPS:-1}"
CURRENCY_HEDGE_LOOPS="${CURRENCY_HEDGE_SELF_IMPROVE_LOOPS:-1}"
DASHBOARD_QUALITY_TARGET="${DASHBOARD_QUALITY_TARGET:-95}"
DEPLOYMENT_READY_TARGET="${DEPLOYMENT_READY_TARGET:-95}"
PYTHON_BIN="${PYTHON_BIN:-python3}"

is_true() {
  case "${1,,}" in
    1|true|yes|y|on) return 0 ;;
    *) return 1 ;;
  esac
}

require_positive_integer() {
  local name="$1"
  local value="$2"

  if ! [[ "$value" =~ ^[0-9]+$ ]] || [[ "$value" -lt 1 ]]; then
    echo "${name} must be a positive integer." >&2
    exit 2
  fi
}

require_positive_integer "DASHBOARD_LOOPS" "$DASHBOARD_LOOPS"
require_positive_integer "CURRENCY_HEDGE_SELF_IMPROVE_LOOPS" "$CURRENCY_HEDGE_LOOPS"

if ! is_true "$CONTINUOUS"; then
  require_positive_integer "ALL_PROJECT_SELF_IMPROVE_LOOPS" "$LOOPS"
fi

run_iteration() {
  local iteration_label="$1"

  echo "=== all-project self-improve ${iteration_label}: root deploy gate ==="
  npm run check:deploy

  echo "=== all-project self-improve ${iteration_label}: dashboard quality loop (${DASHBOARD_LOOPS}) ==="
  DASHBOARD_LOOPS="$DASHBOARD_LOOPS" \
    DASHBOARD_QUALITY_TARGET="$DASHBOARD_QUALITY_TARGET" \
    npm run self-improve:dashboard -- "$DASHBOARD_LOOPS"

  echo "=== all-project self-improve ${iteration_label}: currency hedge loop (${CURRENCY_HEDGE_LOOPS}) ==="
  (
    cd currency-hedge-llm
    PYTHON_BIN="$PYTHON_BIN" \
      SELF_IMPROVE_LOOPS="$CURRENCY_HEDGE_LOOPS" \
      DEPLOYMENT_READY_TARGET="$DEPLOYMENT_READY_TARGET" \
      bash scripts/self_improve.sh "$CURRENCY_HEDGE_LOOPS"
  )
}

if is_true "$CONTINUOUS"; then
  iteration=1
  while true; do
    run_iteration "${iteration}/continuous"
    iteration=$((iteration + 1))
  done
fi

for iteration in $(seq 1 "$LOOPS"); do
  run_iteration "${iteration}/${LOOPS}"
done

echo "All-project self-improvement completed ${LOOPS} clean iteration(s)."
