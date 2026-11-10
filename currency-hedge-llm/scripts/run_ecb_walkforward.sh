#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"
HISTORY_CSV="${HISTORY_CSV:-data/research/ecb_usd_majors_v1.csv}"

if [[ ! -f "$HISTORY_CSV" ]]; then
  echo "ECB history CSV not found at ${HISTORY_CSV}; building it first."
  PYTHON_BIN="$PYTHON_BIN" bash scripts/build_ecb_history.sh
fi

"$PYTHON_BIN" -m currency_hedge_llm.cli walk-forward --config config/ecb_walkforward.yaml
