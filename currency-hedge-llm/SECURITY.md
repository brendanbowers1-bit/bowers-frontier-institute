# Security Notes

## Decision-support boundary

This project does not place trades, route orders, connect to trading venues, or authorize hedge execution. It produces recommendations, reports, memos, dashboards, approval status files, and audit logs for Treasury review.

## Secrets

- Do not commit `.env`.
- `OPENAI_API_KEY` is only required for `--llm-provider openai`.
- Prefer `--llm-provider none` or `--llm-provider ollama` for sensitive exposure data unless data governance permits external API use.

## Data handling

- Treat exposure files, counterparty limits, and hedge program data as confidential.
- Store production data outside Git.
- Use governed exports from Bloomberg/Snowflake or approved internal data pipelines.
- Generated reports should be distributed according to Treasury and Finance controls.

## LLM usage

- LLM output is explanatory text only.
- The quant recommendation is generated before any LLM call.
- LLM text must not change hedge ratio, hedge amount, policy bounds, confidence score, or approval status.

## Dependency and deployment hygiene

- Run `python -m pytest` before deployment.
- Run `bash scripts/run_demo.sh` before deployment.
- Run `python -m currency_hedge_llm.cli deployment-readiness --config config/config.example.yaml --threshold 95`.
- Review container and CI results before promoting changes.
