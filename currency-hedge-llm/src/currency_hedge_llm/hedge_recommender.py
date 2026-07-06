"""Policy-aware hedge recommendation generation."""

from __future__ import annotations

from dataclasses import dataclass

import joblib
import numpy as np
import pandas as pd

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.data_loader import load_exposures, load_fx_rates
from currency_hedge_llm.features import build_fx_features


@dataclass(frozen=True)
class RecommendationResult:
    """Summary of a recommendation run."""

    recommendation_path: str
    rows_written: int


def generate_recommendations(config: AppConfig) -> RecommendationResult:
    """Generate hedge recommendations and save them to CSV."""

    if not config.model.model_path.exists():
        raise FileNotFoundError(
            f"Trained model not found at {config.model.model_path}. Run train first."
        )

    model_bundle = joblib.load(config.model.model_path)
    model = model_bundle["model"]
    feature_columns: list[str] = model_bundle["feature_columns"]

    fx_rates = load_fx_rates(config.data.fx_rates_path)
    exposures = load_exposures(config.data.exposures_path)
    features = build_fx_features(
        fx_rates, target_horizon_days=config.model.target_horizon_days
    )

    latest_by_pair = (
        features.dropna(subset=feature_columns)
        .sort_values(["pair", "date"])
        .groupby("pair", as_index=False)
        .tail(1)
        .set_index("pair")
    )

    recommendations = []
    for exposure in exposures.to_dict(orient="records"):
        recommendation = _recommend_for_exposure(
            exposure=exposure,
            latest_by_pair=latest_by_pair,
            model=model,
            feature_columns=feature_columns,
            config=config,
        )
        recommendations.append(recommendation)

    output = pd.DataFrame(recommendations)
    config.recommendation.recommendation_path.parent.mkdir(parents=True, exist_ok=True)
    output.to_csv(config.recommendation.recommendation_path, index=False)
    return RecommendationResult(
        recommendation_path=str(config.recommendation.recommendation_path),
        rows_written=len(output),
    )


def _recommend_for_exposure(
    exposure: dict,
    latest_by_pair: pd.DataFrame,
    model,
    feature_columns: list[str],
    config: AppConfig,
) -> dict:
    direct_pair = f"{exposure['currency']}{exposure['base_currency']}".upper()
    inverse_pair = f"{exposure['base_currency']}{exposure['currency']}".upper()
    pair, inversion_multiplier = _select_pair(direct_pair, inverse_pair, latest_by_pair)

    latest_features = latest_by_pair.loc[pair]
    model_forecast = float(
        model.predict(pd.DataFrame([latest_features[feature_columns]]))[0]
    )
    model_forecast *= inversion_multiplier
    volatility = float(latest_features.get("rolling_vol_20d", np.nan))
    if np.isnan(volatility) or volatility <= 0:
        volatility = float(latest_features.get("rolling_vol_5d", 0.0))

    policy_min = float(exposure["hedge_policy_min_ratio"])
    policy_max = float(exposure["hedge_policy_max_ratio"])
    if policy_min > policy_max:
        raise ValueError(
            f"Exposure {exposure['exposure_id']} has min ratio above max ratio."
        )

    base_ratio = (policy_min + policy_max) / 2.0
    confidence = calculate_confidence(model_forecast=model_forecast, volatility=volatility)
    adverse_move = is_adverse_forecast(
        amount=float(exposure["amount"]), model_forecast=model_forecast
    )

    ratio_adjustment = 0.0
    if adverse_move and abs(model_forecast) >= config.recommendation.adverse_forecast_threshold:
        signal_strength = abs(model_forecast) / max(volatility, 1e-9)
        ratio_adjustment += min(
            config.recommendation.max_ratio_adjustment,
            0.05 + 0.03 * signal_strength,
        )

    if confidence < config.recommendation.low_confidence_threshold:
        ratio_adjustment -= min(0.10, config.recommendation.max_ratio_adjustment / 2)

    suggested_ratio = clamp(base_ratio + ratio_adjustment, policy_min, policy_max)
    suggested_amount = float(exposure["amount"]) * suggested_ratio
    residual_unhedged_amount = float(exposure["amount"]) - suggested_amount
    minimum_trade_size = _minimum_trade_size(exposure, config)
    counterparty_limit = _optional_float(exposure.get("counterparty_limit"))
    review_flags = _review_flags(
        suggested_amount=suggested_amount,
        residual_unhedged_amount=residual_unhedged_amount,
        minimum_trade_size=minimum_trade_size,
        counterparty_limit=counterparty_limit,
        confidence=confidence,
        accounting_designation=str(exposure.get("accounting_designation", "")),
        config=config,
    )

    return {
        "exposure_id": exposure["exposure_id"],
        "as_of_date": latest_features["date"].date().isoformat(),
        "entity": exposure.get("entity", ""),
        "exposure_currency": exposure["currency"],
        "base_currency": exposure["base_currency"],
        "fx_pair_used": pair,
        "exposure_amount": float(exposure["amount"]),
        "tenor_days": int(exposure["tenor_days"]),
        "hedge_program": exposure.get("hedge_program", "unassigned"),
        "accounting_designation": exposure.get(
            "accounting_designation", "undesignated"
        ),
        "liquidity_bucket": exposure.get("liquidity_bucket", "standard"),
        "model_forecast_next_return": model_forecast,
        "rolling_20d_volatility": volatility,
        "suggested_hedge_ratio": suggested_ratio,
        "suggested_hedge_amount": suggested_amount,
        "residual_unhedged_amount": residual_unhedged_amount,
        "confidence_level": confidence,
        "policy_min_ratio": policy_min,
        "policy_max_ratio": policy_max,
        "minimum_trade_size": minimum_trade_size,
        "counterparty_limit": counterparty_limit,
        "approval_status": exposure.get("approval_status", "draft"),
        "reviewer": exposure.get("reviewer", "unassigned"),
        "review_flags": "; ".join(review_flags) if review_flags else "none",
        "recommended_next_step": _recommended_next_step(review_flags),
        "forecast_direction": "adverse" if adverse_move else "favorable_or_neutral",
        "reason_policy_midpoint": base_ratio,
        "reason_adverse_move": (
            "Forecast suggests an adverse move for this signed exposure."
            if adverse_move
            else "Forecast does not suggest an adverse move for this signed exposure."
        ),
        "reason_confidence": _confidence_reason(confidence),
        "decision_support_warning": (
            "Decision support only; Treasury must review before any hedge execution."
        ),
    }


def calculate_confidence(model_forecast: float, volatility: float) -> float:
    """Convert forecast strength versus volatility into a 0-1 confidence score."""

    if volatility <= 0:
        return 0.1
    signal_to_noise = abs(model_forecast) / volatility
    return clamp(0.15 + signal_to_noise / 2.5, 0.0, 1.0)


def is_adverse_forecast(amount: float, model_forecast: float) -> bool:
    """Return True when the forecast is unfavorable for the signed exposure."""

    if amount >= 0:
        return model_forecast < 0
    return model_forecast > 0


def clamp(value: float, lower: float, upper: float) -> float:
    """Clamp a number between inclusive lower and upper bounds."""

    return min(max(value, lower), upper)


def _minimum_trade_size(exposure: dict, config: AppConfig) -> float:
    value = _optional_float(exposure.get("minimum_trade_size"))
    if value is None:
        return float(config.recommendation.default_minimum_trade_size)
    return value


def _optional_float(value: object) -> float | None:
    if value is None or pd.isna(value):
        return None
    return float(value)


def _review_flags(
    suggested_amount: float,
    residual_unhedged_amount: float,
    minimum_trade_size: float,
    counterparty_limit: float | None,
    confidence: float,
    accounting_designation: str,
    config: AppConfig,
) -> list[str]:
    flags: list[str] = []
    if abs(suggested_amount) < minimum_trade_size:
        flags.append("below_minimum_trade_size")
    if counterparty_limit is not None and abs(suggested_amount) > counterparty_limit:
        flags.append("counterparty_limit_review")
    if confidence < config.recommendation.approval_confidence_threshold:
        flags.append("low_confidence_review")
    if (
        abs(residual_unhedged_amount)
        > config.recommendation.max_unhedged_amount_warning
    ):
        flags.append("large_residual_unhedged_exposure")
    if "hedge_accounting" in accounting_designation:
        flags.append("hedge_accounting_documentation_review")
    return flags


def _recommended_next_step(review_flags: list[str]) -> str:
    if "below_minimum_trade_size" in review_flags:
        return "Aggregate with similar exposures or monitor until trade size is met."
    if "counterparty_limit_review" in review_flags:
        return "Review counterparty capacity before any hedge execution decision."
    if "low_confidence_review" in review_flags:
        return "Escalate for Treasury review; model confidence is below threshold."
    if "hedge_accounting_documentation_review" in review_flags:
        return "Prepare hedge-accounting support package before approval."
    return "Ready for Treasury review within policy bounds; no auto-execution."


def _select_pair(
    direct_pair: str, inverse_pair: str, latest_by_pair: pd.DataFrame
) -> tuple[str, float]:
    if direct_pair in latest_by_pair.index:
        return direct_pair, 1.0
    if inverse_pair in latest_by_pair.index:
        return inverse_pair, -1.0
    raise ValueError(
        f"No FX history found for {direct_pair} or inverse pair {inverse_pair}."
    )


def _confidence_reason(confidence: float) -> str:
    if confidence < 0.35:
        return "Low confidence; hedge ratio was reduced within policy bounds."
    if confidence < 0.70:
        return "Moderate confidence; recommendation stays close to policy midpoint."
    return "Higher confidence; forecast has stronger signal versus recent volatility."
