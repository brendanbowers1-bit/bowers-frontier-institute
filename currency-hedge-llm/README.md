# currency-hedge-llm

Treasury FX hedging decision support that trains a simple quantitative model, generates policy-bounded hedge recommendations, and optionally uses an LLM to write a plain-English hedge memo.

> This repository is for decision support only. It does not place trades, route orders, or auto-execute hedges. Treasury should review model output, policy constraints, market data, and counterparty/execution considerations before acting.

## What the repo does

- Loads FX spot data, interest rates, forward points, and exposure data from CSV files.
- Normalizes Bloomberg-style market data exports and Snowflake-style exposure exports.
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
- Initializes an approval status file and audit trail for Treasury review.
- Generates a static HTML dashboard for committee review.
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

## Normalize source exports

```bash
python -m currency_hedge_llm.cli ingest --config config/config.example.yaml
```

This writes canonical data files:

```text
data/processed/normalized_fx_rates.csv
data/processed/normalized_forward_curve.csv
data/processed/normalized_exposures.csv
```

By default, the command normalizes the bundled sample files. For real data, set these config values:

```yaml
ingestion:
  bloomberg_fx_export_path: path/to/bloomberg_fx_export.csv
  bloomberg_forward_curve_export_path: path/to/bloomberg_forward_curve.csv
  snowflake_exposures_export_path: path/to/snowflake_exposures_export.csv
```

The adapters are CSV-based scaffolds by design. They avoid proprietary runtime dependencies and give you a governed place to map approved Bloomberg and Snowflake exports into the canonical model schema.

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

The validation gate checks that required artifacts exist, hedge ratios stay within policy bounds, confidence scores are between 0 and 1, scenario shocks match config, VaR/CVaR values are non-negative and ordered correctly, approval/audit files preserve no-auto-execution controls, and the memo/dashboard contain required decision-support safety language.

## Score deployment readiness

```bash
python -m currency_hedge_llm.cli deployment-readiness --config config/config.example.yaml --threshold 95
```

The readiness score is a deployment gate across packaging, tests, runbooks, security notes, CI, container files, workflow validation, and no-trade-execution documentation.

## Container usage

```bash
docker build -t currency-hedge-llm:local .
docker run --rm currency-hedge-llm:local
```

The default container command runs the full no-LLM workflow. For local output persistence:

```bash
docker run --rm \
  -v "$PWD/reports:/app/reports" \
  -v "$PWD/models:/app/models" \
  -v "$PWD/data/processed:/app/data/processed" \
  currency-hedge-llm:local \
  bash scripts/run_demo.sh
```

Run deployment readiness from the checked-out repository or CI environment so the scorecard can see repo-level workflow files.

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

## Initialize approval workflow

```bash
python -m currency_hedge_llm.cli approval --config config/config.example.yaml --action initialize
```

This writes:

```text
reports/approval_status.csv
reports/approval_audit_log.csv
```

To update a status manually:

```bash
python -m currency_hedge_llm.cli approval \
  --config config/config.example.yaml \
  --action set-status \
  --exposure-id AR-EUR-001 \
  --status changes_requested \
  --actor "Treasury Director" \
  --comment "Need updated exposure support."
```

Allowed statuses:

- `pending_treasury_review`
- `changes_requested`
- `rejected`
- `approved_for_manual_treasury_action`

Even approved workflow statuses remain decision support only and do not execute hedges.

## Generate dashboard

```bash
python -m currency_hedge_llm.cli dashboard --config config/config.example.yaml
```

This writes:

```text
reports/dashboard.html
```

The dashboard summarizes gross exposure, suggested hedge amount, residual exposure, VaR estimate, review flags, netted exposures, residual risk, and approval status.

## Run the full demo

```bash
bash scripts/run_demo.sh
```

The demo installs the package, runs doctor preflight checks, normalizes source
exports, trains the model, nets exposures, generates recommendations, writes risk
reports, initializes approval status/audit outputs, verifies model and
recommendation artifacts, creates a memo with `--llm-provider none`, generates a
dashboard, and validates the generated workflow outputs.

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

## Run the self-improvement loop

```bash
bash scripts/self_improve.sh 2
```

The loop is intentionally bounded. Each iteration runs:

1. `python -m pytest`
2. `bash scripts/run_demo.sh`
3. the built-in workflow validation gate
4. deployment readiness with `DEPLOYMENT_READY_TARGET`, defaulting to `95`

The script stops at the first failed test, demo command, or validation check so issues can be fixed before the next iteration.

To enforce a different target:

```bash
DEPLOYMENT_READY_TARGET=95 SELF_IMPROVE_LOOPS=3 bash scripts/self_improve.sh
```

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

Forward curve data should include:

```text
date,pair,tenor_days,forward_points,implied_forward_rate
```

Recommendations match each exposure tenor to the nearest available forward-curve tenor and include matched forward points and implied forward rate in the recommendation and memo outputs.

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
