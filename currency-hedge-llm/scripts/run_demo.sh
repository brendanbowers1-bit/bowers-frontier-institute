#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"

"$PYTHON_BIN" -m pip install -e .
"$PYTHON_BIN" -m currency_hedge_llm.cli doctor --config config/config.example.yaml --create-output-dirs
"$PYTHON_BIN" -m currency_hedge_llm.cli train --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli recommend --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli doctor --config config/config.example.yaml --require-model --require-recommendations
"$PYTHON_BIN" -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider none

echo "Demo complete."
echo "Recommendations: reports/hedge_recommendations.csv"
echo "Memo: reports/hedge_memo.md"
