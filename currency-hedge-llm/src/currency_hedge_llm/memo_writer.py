"""Hedge memo generation with optional LLM language support."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

import pandas as pd

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.llm.base import LLMClient
from currency_hedge_llm.llm.local_ollama import OllamaClient
from currency_hedge_llm.llm.openai_client import OpenAIResponsesClient


DECISION_SUPPORT_WARNING = (
    "This is decision support only. Model output must be reviewed by Treasury, "
    "hedges must not be auto-executed from this tool, and LLM text must not be "
    "used as the sole basis for hedge decisions."
)


@dataclass(frozen=True)
class MemoResult:
    """Summary of a memo writing run."""

    memo_path: str
    llm_provider: str


def write_memo(config: AppConfig, llm_provider: str | None = None) -> MemoResult:
    """Write a treasury hedge memo from saved recommendations."""

    provider = (llm_provider or config.llm.provider).lower()
    if not config.recommendation.recommendation_path.exists():
        raise FileNotFoundError(
            "Recommendation file not found. Run the recommend command before memo."
        )

    recommendations = pd.read_csv(config.recommendation.recommendation_path)
    explanation = _build_fallback_explanation(recommendations)
    if provider != "none":
        client = _build_llm_client(config, provider)
        prompt = _build_llm_prompt(recommendations)
        llm_text = client.generate(prompt)
        if llm_text:
            explanation = llm_text

    memo = _render_memo(
        recommendations=recommendations,
        explanation=explanation,
        provider=provider,
        next_review_date=date.today() + timedelta(days=config.memo.next_review_days),
    )
    config.memo.memo_path.parent.mkdir(parents=True, exist_ok=True)
    config.memo.memo_path.write_text(memo, encoding="utf-8")
    return MemoResult(memo_path=str(config.memo.memo_path), llm_provider=provider)


def _build_llm_client(config: AppConfig, provider: str) -> LLMClient:
    if provider == "ollama":
        return OllamaClient(
            model=config.llm.local_model,
            url=config.llm.local_url,
            temperature=config.llm.temperature,
        )
    if provider == "openai":
        return OpenAIResponsesClient(
            model=config.llm.openai_model,
            url=config.llm.openai_url,
            temperature=config.llm.temperature,
        )
    raise ValueError("llm_provider must be one of: none, ollama, openai")


def _build_llm_prompt(recommendations: pd.DataFrame) -> str:
    records = recommendations.to_dict(orient="records")
    return (
        "You are writing for a corporate treasury FX hedging committee. "
        "Use professional treasury language. Explain the hedge recommendation, "
        "policy bounds, forecast signal, volatility, key risks, assumptions, "
        "model limitations, and review cadence. Do not imply any automatic trade "
        "execution. Recommendation records:\n"
        f"{records}"
    )


def _build_fallback_explanation(recommendations: pd.DataFrame) -> str:
    lines = [
        "The quantitative hedge model was used to estimate next-period FX return "
        "direction and recent volatility for each exposure. The suggested hedge "
        "ratio starts from the midpoint of the approved hedge policy range, then "
        "moves higher when the forecast indicates an adverse currency move and "
        "lower when model confidence is limited.",
        "",
    ]
    for row in recommendations.to_dict(orient="records"):
        lines.append(
            "- Exposure {exposure_id}: recommend hedging {ratio:.1%} of the "
            "{currency} exposure versus {base}, equal to {amount:,.2f} in signed "
            "exposure currency notional. The forecast is classified as {direction} "
            "with confidence {confidence:.0%} and 20-day volatility of {vol:.2%}.".format(
                exposure_id=row["exposure_id"],
                ratio=row["suggested_hedge_ratio"],
                currency=row["exposure_currency"],
                base=row["base_currency"],
                amount=row["suggested_hedge_amount"],
                direction=str(row["forecast_direction"]).replace("_", " "),
                confidence=row["confidence_level"],
                vol=row["rolling_20d_volatility"],
            )
        )
    return "\n".join(lines)


def _render_memo(
    recommendations: pd.DataFrame,
    explanation: str,
    provider: str,
    next_review_date: date,
) -> str:
    recommendation_table = _markdown_table(
        recommendations,
        [
            "exposure_id",
            "entity",
            "exposure_currency",
            "base_currency",
            "exposure_amount",
            "model_forecast_next_return",
            "rolling_20d_volatility",
            "suggested_hedge_ratio",
            "suggested_hedge_amount",
            "residual_unhedged_amount",
            "confidence_level",
            "policy_min_ratio",
            "policy_max_ratio",
            "review_flags",
        ],
    )
    review_table = _markdown_table(
        recommendations,
        [
            "exposure_id",
            "hedge_program",
            "accounting_designation",
            "liquidity_bucket",
            "minimum_trade_size",
            "counterparty_limit",
            "approval_status",
            "reviewer",
            "recommended_next_step",
        ],
    )

    return f"""# FX Hedge Recommendation Memo

## Decision Support Warning

{DECISION_SUPPORT_WARNING}

## Executive Summary

{explanation}

## Hedge Recommendation

{recommendation_table}

## Operational Review Controls

{review_table}

## Risk Factors

- FX spot rates may gap beyond recent realized-volatility ranges.
- Forward points and interest-rate differentials can change before execution.
- Forecasts are short-horizon statistical estimates and may not capture event risk.
- Liquidity, counterparty limits, credit support, and hedge-accounting constraints must be reviewed separately.

## Assumptions

- Exposure amounts are signed in exposure currency.
- Positive exposure amounts represent long foreign-currency exposure; negative amounts represent payable or short exposure.
- Policy minimum and maximum hedge ratios are approved bounds and must not be exceeded.
- Minimum trade size, counterparty limit, approval status, and hedge-accounting fields are review controls only.
- Any final hedge instrument, tenor, counterparty, and execution timing require Treasury approval.

## Model Limitations

- The baseline RandomForestRegressor is trained on sample FX, rate, forward-points, volatility, and exposure data.
- The model forecasts next-period FX return, not realized hedge effectiveness or accounting outcomes.
- The confidence score is a transparent signal-to-volatility heuristic, not a probability of profit.
- LLM provider used for wording: `{provider}`. LLM output is explanatory text only and does not change the quantitative recommendation.

## Next Review Date

{next_review_date.isoformat()}
"""


def _markdown_table(frame: pd.DataFrame, columns: list[str]) -> str:
    rows = [columns, ["---"] * len(columns)]
    for record in frame[columns].to_dict(orient="records"):
        rows.append([_format_table_value(column, record[column]) for column in columns])
    return "\n".join("| " + " | ".join(map(str, row)) + " |" for row in rows)


def _format_table_value(column: str, value: object) -> str:
    if pd.isna(value):
        return ""
    if isinstance(value, float) and column.endswith("_amount"):
        return f"{value:,.2f}"
    if isinstance(value, float) and column in {"minimum_trade_size", "counterparty_limit"}:
        return f"{value:,.2f}"
    if isinstance(value, float) and (
        column.endswith("_ratio")
        or column == "confidence_level"
        or column == "rolling_20d_volatility"
        or column == "model_forecast_next_return"
    ):
        return f"{value:.2%}"
    return str(value)
