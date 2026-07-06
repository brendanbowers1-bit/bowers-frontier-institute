#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"

"$PYTHON_BIN" -m pip install -e .
"$PYTHON_BIN" -m currency_hedge_llm.cli train --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli netting --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli recommend --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli risk --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider none
"$PYTHON_BIN" -m currency_hedge_llm.cli validate --config config/config.example.yaml

echo "Demo complete."
echo "Netting: reports/netted_exposures.csv"
echo "Recommendations: reports/hedge_recommendations.csv"
echo "Risk: reports/model_backtest.csv, reports/scenario_analysis.csv, reports/risk_summary.csv"
echo "Memo: reports/hedge_memo.md"
