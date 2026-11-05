#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"

"$PYTHON_BIN" -m pip install -e .
"$PYTHON_BIN" -m currency_hedge_llm.cli doctor --config config/config.example.yaml --create-output-dirs
"$PYTHON_BIN" -m currency_hedge_llm.cli ingest --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli train --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli netting --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli recommend --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli risk --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli approval --config config/config.example.yaml --action initialize
"$PYTHON_BIN" -m currency_hedge_llm.cli doctor --config config/config.example.yaml --require-model --require-recommendations
"$PYTHON_BIN" -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider none
"$PYTHON_BIN" -m currency_hedge_llm.cli dashboard --config config/config.example.yaml
"$PYTHON_BIN" -m currency_hedge_llm.cli validate --config config/config.example.yaml

echo "Demo complete."
echo "Normalized data: data/processed/normalized_fx_rates.csv, data/processed/normalized_forward_curve.csv, data/processed/normalized_exposures.csv"
echo "Netting: reports/netted_exposures.csv"
echo "Recommendations: reports/hedge_recommendations.csv"
echo "Risk: reports/model_backtest.csv, reports/model_backtest_pair_metrics.csv, reports/scenario_analysis.csv, reports/risk_summary.csv"
echo "Approval: reports/approval_status.csv, reports/approval_audit_log.csv"
echo "Memo: reports/hedge_memo.md"
echo "Dashboard: reports/dashboard.html"
