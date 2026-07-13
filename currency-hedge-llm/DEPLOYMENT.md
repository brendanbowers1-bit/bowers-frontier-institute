# Deployment Runbook

This project is a treasury FX hedging decision-support workflow. No automatic trade execution is present or allowed.

## Deployment readiness target

Use the built-in scorecard:

```bash
python -m currency_hedge_llm.cli deployment-readiness --config config/config.example.yaml --threshold 95
```

The target for this repo is at least `95/100`.

## Recommended validation sequence

```bash
python -m pip install -e .
python -m pytest
bash scripts/run_demo.sh
python -m currency_hedge_llm.cli deployment-readiness --config config/config.example.yaml --threshold 95
```

Or run the bounded loop:

```bash
DEPLOYMENT_READY_TARGET=95 bash scripts/self_improve.sh 2
```

## Container build

```bash
docker build -t currency-hedge-llm:local .
```

Run the readiness command in the image:

```bash
docker run --rm currency-hedge-llm:local
```

The image runs the full no-LLM workflow by default. For workflow execution with local output persistence:

```bash
docker run --rm \
  -v "$PWD/reports:/app/reports" \
  -v "$PWD/models:/app/models" \
  -v "$PWD/data/processed:/app/data/processed" \
  currency-hedge-llm:local \
  bash scripts/run_demo.sh
```

Run deployment readiness from the checked-out repository or CI environment so the scorecard can see repo-level CI files:

```bash
python -m currency_hedge_llm.cli deployment-readiness --config config/config.example.yaml --threshold 95
```

## Production configuration

Start from:

```text
config/production.example.yaml
```

Expected production inputs:

- Bloomberg-style FX/rates export CSV
- Bloomberg-style forward curve export CSV
- Snowflake-style exposure export CSV

The production config points ingestion outputs to `data/processed/` and all workflow artifacts to `reports/`.

## Operational controls

- No automatic trade execution.
- No order placement APIs.
- No counterparty connectivity.
- Approval status means "approved for manual Treasury action" only.
- Audit logs are local workflow records, not trade confirmations.
- LLM usage is explanatory only and must not change hedge ratios or notional amounts.

## Promotion checklist

1. Confirm data governance for source exports and optional LLM provider.
2. Run `python -m pytest`.
3. Run `bash scripts/run_demo.sh`.
4. Run deployment readiness with threshold `95`.
5. Review `reports/hedge_recommendations.csv`.
6. Review `reports/hedge_memo.md`.
7. Review `reports/dashboard.html`.
8. Confirm approval workflow owners and audit retention.
9. Deploy the container or scheduled job in decision-support mode only.
