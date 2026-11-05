#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PYTHON_BIN="${PYTHON_BIN:-python3}"
OUTPUT_DIR="${OUTPUT_DIR:-data/research}"

"$PYTHON_BIN" -m currency_hedge_llm.cli build-ecb-history --output-dir "$OUTPUT_DIR"
