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

Developer/test tooling is kept out of the runtime install:

```bash
python -m pip install -e ".[dev]"
pytest
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

Validate input files and writable output directories before a run:

```bash
python -m currency_hedge_llm.cli doctor --config config/config.example.yaml --create-output-dirs
```

The doctor validates required CSV schemas, output directory writability, and
configured LLM provider names before the batch workflow starts.

```bash
python -m currency_hedge_llm.cli train --config config/config.example.yaml
```

This writes:

```text
models/hedge_model.joblib
data/processed/fx_features.csv
```

## Generate recommendations

For a deploy/runtime check that also requires an existing trained model:

```bash
python -m currency_hedge_llm.cli doctor --config config/config.example.yaml --require-model
```

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

Before memo generation, require both the trained model and recommendation CSV:

```bash
python -m currency_hedge_llm.cli doctor --config config/config.example.yaml --require-model --require-recommendations
```

## Run the full demo

```bash
bash scripts/run_demo.sh
```

The demo installs the package, runs doctor preflight checks, trains the model,
generates recommendations, verifies model/recommendation artifacts, and writes a
memo with `--llm-provider none`.

## Container build

The CLI can be built as a container for repeatable batch runs:

```bash
docker build -t currency-hedge-llm .
docker run --rm currency-hedge-llm train --config config/config.example.yaml
```

For stateful runs, mount writable directories for generated artifacts:

```bash
docker run --rm \
  -v "$PWD/models:/app/models" \
  -v "$PWD/reports:/app/reports" \
  -v "$PWD/data/processed:/app/data/processed" \
  currency-hedge-llm train --config config/config.example.yaml
```

Run `recommend` after a trained model exists, then run `memo --llm-provider none`
or configure `ollama`/`openai` for LLM-written memo text.

## CI and deployment readiness

The repository CI installs `.[dev]`, runs `pytest`, and executes
`python -m currency_hedge_llm.cli doctor --config config/config.example.yaml --create-output-dirs`
and `bash scripts/run_demo.sh` with the deterministic `none` memo provider.
This keeps the quant pipeline and packaging path covered without requiring
external LLM services or API keys.

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

Use signed exposure amounts:

- positive amount: long foreign-currency exposure, such as a receivable or forecasted inflow
- negative amount: short foreign-currency exposure, such as a payable or forecasted outflow

## Suggested next improvements

- Bloomberg ingestion
- Snowflake integration
- FX forward curve data
- Exposure netting
- Backtesting
- Scenario analysis
- VaR / CVaR
- Hedge accounting documentation support
- Dashboard
- Approval workflow

## Safety notes

- This is decision support only.
- Model output should be reviewed by Treasury.
- Do not auto-execute trades from this tool.
- Do not rely only on LLM output for hedge decisions.
