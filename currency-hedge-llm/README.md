# currency-hedge-llm

Treasury FX hedging decision support that trains a simple quantitative model, generates policy-bounded hedge recommendations, and optionally uses an LLM to write a plain-English hedge memo.

> This repository is for decision support only. It does not place trades, route orders, or auto-execute hedges. Treasury should review model output, policy constraints, market data, and counterparty/execution considerations before acting.

## What the repo does

- Loads FX spot data, interest rates, forward points, and exposure data from CSV files.
- Builds transparent FX features:
  - daily FX return
  - rolling 5-day volatility
  - rolling 20-day volatility
  - moving-average signal
  - interest-rate differential
  - forward-points signal
- Trains a baseline `RandomForestRegressor` to forecast next-period FX return.
- Converts the forecast into a hedge recommendation using policy bounds and signed exposure direction.
- Nets exposures by entity, currency, tenor bucket, hedge program, and accounting designation.
- Produces backtest, scenario-shock, and VaR/CVaR-style residual-risk reports.
- Adds review controls for minimum trade size, counterparty limits, approval status, and hedge-accounting documentation.
- Produces a hedge memo in treasury language.
- Supports three memo modes:
  - `none`: deterministic memo text, no API key or local model required.
  - `ollama`: local LLM through Ollama.
  - `openai`: non-local/API LLM through OpenAI's Responses API.

## Why the quant model and LLM are separate

The quant model owns the numeric hedge recommendation. It computes features, forecasts next-period FX return, estimates confidence, and clamps hedge ratios within approved policy limits.

The LLM owns explanation only. It can make the memo easier to read, but it does not alter the forecast, hedge ratio, hedge amount, policy bounds, or confidence score. This separation helps treasury reviewers trace the recommendation back to data and model logic instead of relying on generated text.

## Setup

Requires Python 3.11+.

```bash
cd currency-hedge-llm
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e .
```

Optional Hugging Face fine-tuning packages are scaffolded but not required for the demo:

```bash
python -m pip install -e ".[fine-tuning]"
```

## Local LLM setup with Ollama

Install Ollama from <https://ollama.com>, then pull the default local model:

```bash
bash scripts/pull_local_llm.sh
```

The default local model is `qwen2.5:7b-instruct`, using:

```text
http://localhost:11434/api/generate
```

You can change the model or URL in `config/config.example.yaml`.

## API LLM setup with OpenAI

Copy the example environment file and set your key:

```bash
cp .env.example .env
```

Edit `.env`:

```text
OPENAI_API_KEY=sk-your-api-key-here
```

The default OpenAI model is configured in `config/config.example.yaml` under `llm.openai_model`.

## Train

```bash
python -m currency_hedge_llm.cli train --config config/config.example.yaml
```

This writes:

```text
models/hedge_model.joblib
data/processed/fx_features.csv
```

## Generate recommendations

```bash
python -m currency_hedge_llm.cli recommend --config config/config.example.yaml
```

This writes:

```text
reports/hedge_recommendations.csv
```

Recommendation logic:

1. Start with the midpoint between `hedge_policy_min_ratio` and `hedge_policy_max_ratio`.
2. Increase the hedge ratio if the model forecast indicates a material adverse move for the signed exposure.
3. Decrease the hedge ratio when confidence is low.
4. Clamp the final hedge ratio inside policy bounds.
5. Never recommend outside approved policy minimum and maximum ratios.
6. Add human-review flags for minimum trade size, counterparty capacity, confidence, residual exposure, and hedge-accounting documentation.

## Net exposures

```bash
python -m currency_hedge_llm.cli netting --config config/config.example.yaml
```

This writes:

```text
reports/netted_exposures.csv
```

The netting report groups exposures by entity, currency pair, tenor bucket, hedge program, and accounting designation. It reports gross exposure, net exposure, netting benefit, conservative policy intersections, and review notes.

## Generate backtest and risk reports

```bash
python -m currency_hedge_llm.cli risk --config config/config.example.yaml
```

This writes:

```text
reports/model_backtest.csv
reports/scenario_analysis.csv
reports/risk_summary.csv
```

Reports include:

- historical predicted versus realized next-period FX returns
- direction-hit indicator and absolute forecast error
- configured FX shock scenarios on residual unhedged exposure
- VaR/CVaR-style residual-risk estimates for treasury review

## Validate generated workflow outputs

```bash
python -m currency_hedge_llm.cli validate --config config/config.example.yaml
```

The validation gate checks that required artifacts exist, hedge ratios stay within policy bounds, confidence scores are between 0 and 1, scenario shocks match config, VaR/CVaR values are non-negative and ordered correctly, and the memo contains required decision-support safety language.

## Generate a hedge memo

No LLM required:

```bash
python -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider none
```

Local Ollama:

```bash
python -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider ollama
```

OpenAI:

```bash
python -m currency_hedge_llm.cli memo --config config/config.example.yaml --llm-provider openai
```

All modes write:

```text
reports/hedge_memo.md
```

## Run the full demo

```bash
bash scripts/run_demo.sh
```

The demo installs the package, trains the model, nets exposures, generates recommendations, writes risk reports, creates a memo with `--llm-provider none`, and validates the generated workflow outputs.

## Run the self-improvement loop

```bash
bash scripts/self_improve.sh 2
```

The loop is intentionally bounded. Each iteration runs:

1. `python -m pytest`
2. `bash scripts/run_demo.sh`
3. the built-in workflow validation gate

The script stops at the first failed test, demo command, or validation check so issues can be fixed before the next iteration.

## Replace sample data with real work data

Replace or point the config to your own files:

```yaml
data:
  fx_rates_path: data/raw/your_fx_rates.csv
  exposures_path: data/raw/your_exposures.csv
```

FX rates must include:

```text
date,pair,spot,domestic_rate,foreign_rate,forward_points
```

`domestic_rate`, `foreign_rate`, and `forward_points` are recommended. If rates or forward points are unavailable, the core spot-return and volatility features still work.

Exposures must include:

```text
exposure_id,date,entity,currency,base_currency,amount,hedge_policy_min_ratio,hedge_policy_max_ratio,tenor_days
```

Recommended operational columns:

```text
hedge_program,accounting_designation,liquidity_bucket,counterparty_limit,minimum_trade_size,approval_status,reviewer
```

Use signed exposure amounts:

- positive amount: long foreign-currency exposure, such as a receivable or forecasted inflow
- negative amount: short foreign-currency exposure, such as a payable or forecasted outflow

For a Western Union-style workflow, map your exposure file to legal entity, hedge program, accounting designation, forecast tenor, policy min/max, counterparty capacity, and minimum execution size before running the demo.

## Expanded workflow controls

The project now includes scaffolding for:

- exposure netting
- backtesting
- scenario analysis
- VaR / CVaR-style residual-risk estimates
- hedge-accounting documentation review flags
- approval status and reviewer fields
- minimum trade size and counterparty limit review flags

These controls are reporting and review aids only. They do not execute hedges.

## Suggested next improvements

- Bloomberg ingestion
- Snowflake integration
- FX forward curve data
- richer hedge effectiveness testing
- Dashboard
- persistent approval workflow with audit log and signoffs

## Safety notes

- This is decision support only.
- Model output should be reviewed by Treasury.
- Do not auto-execute trades from this tool.
- Do not rely only on LLM output for hedge decisions.
