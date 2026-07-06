#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

python -m pip install -e .
python -m currency_hedge_llm.cli train --config config/config.example.yaml
python -m currency_hedge_llm.cli recommend --config config/config.example.yaml
python -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider none

echo "Demo complete."
echo "Recommendations: reports/hedge_recommendations.csv"
echo "Memo: reports/hedge_memo.md"
