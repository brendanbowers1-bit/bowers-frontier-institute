"""Backtesting, scenario analysis, and residual FX risk reports."""

from __future__ import annotations

from dataclasses import dataclass

import joblib
import numpy as np
import pandas as pd

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.data_loader import load_exposures, load_fx_rates
from currency_hedge_llm.features import build_fx_features


@dataclass(frozen=True)
class RiskReportResult:
    """Summary of risk report generation."""

    backtest_path: str
    pair_metrics_path: str
    scenario_path: str
    risk_summary_path: str
    backtest_rows: int
    pair_metrics_rows: int
    scenario_rows: int
    risk_summary_rows: int


def generate_risk_reports(config: AppConfig) -> RiskReportResult:
    """Generate backtest, scenario, and VaR/CVaR residual-risk reports."""

    backtest = generate_backtest_frame(config)
    pair_metrics = generate_pair_backtest_metrics(backtest)
    scenario = generate_scenario_frame(config)
    risk_summary = generate_risk_summary_frame(config)

    config.risk.backtest_path.parent.mkdir(parents=True, exist_ok=True)
    config.risk.pair_metrics_path.parent.mkdir(parents=True, exist_ok=True)
    config.risk.scenario_path.parent.mkdir(parents=True, exist_ok=True)
    config.risk.risk_summary_path.parent.mkdir(parents=True, exist_ok=True)
    backtest.to_csv(config.risk.backtest_path, index=False)
    pair_metrics.to_csv(config.risk.pair_metrics_path, index=False)
    scenario.to_csv(config.risk.scenario_path, index=False)
    risk_summary.to_csv(config.risk.risk_summary_path, index=False)
    return RiskReportResult(
        backtest_path=str(config.risk.backtest_path),
        pair_metrics_path=str(config.risk.pair_metrics_path),
        scenario_path=str(config.risk.scenario_path),
        risk_summary_path=str(config.risk.risk_summary_path),
        backtest_rows=len(backtest),
        pair_metrics_rows=len(pair_metrics),
        scenario_rows=len(scenario),
        risk_summary_rows=len(risk_summary),
    )


def generate_backtest_frame(config: AppConfig) -> pd.DataFrame:
    """Score historical model predictions against realized next-period returns."""

    bundle = _load_model_bundle(config)
    fx_rates = load_fx_rates(config.data.fx_rates_path)
    features = build_fx_features(
        fx_rates, target_horizon_days=config.model.target_horizon_days
    )
    feature_columns: list[str] = bundle["feature_columns"]
    scored = features.dropna(subset=feature_columns + ["target_next_return"]).copy()
    scored = _filter_backtest_window(scored, config.risk.backtest_years)
    scored["predicted_next_return"] = bundle["model"].predict(scored[feature_columns])
    scored["prediction_error"] = (
        scored["predicted_next_return"] - scored["target_next_return"]
    )
    scored["absolute_error"] = scored["prediction_error"].abs()
    scored["correct_direction"] = (
        np.sign(scored["predicted_next_return"])
        == np.sign(scored["target_next_return"])
    )
    scored["backtest_window_years"] = int(config.risk.backtest_years)
    scored["backtest_start_date"] = scored["date"].min().date().isoformat()
    scored["backtest_end_date"] = scored["date"].max().date().isoformat()
    output_columns = [
        "date",
        "pair",
        "spot",
        "backtest_window_years",
        "backtest_start_date",
        "backtest_end_date",
        "target_next_return",
        "predicted_next_return",
        "prediction_error",
        "absolute_error",
        "correct_direction",
        "rolling_vol_20d",
        "ma_signal",
        "interest_rate_differential",
        "forward_points_signal",
    ]
    return scored[
        [column for column in output_columns if column in scored.columns]
    ].reset_index(drop=True)


def generate_pair_backtest_metrics(backtest: pd.DataFrame) -> pd.DataFrame:
    """Aggregate backtest quality and data coverage by currency pair."""

    if backtest.empty:
        return pd.DataFrame(
            columns=[
                "pair",
                "rows",
                "start_date",
                "end_date",
                "mean_absolute_error",
                "direction_accuracy",
                "mean_predicted_next_return",
                "mean_realized_next_return",
            ]
        )

    metrics = (
        backtest.groupby("pair", as_index=False)
        .agg(
            rows=("pair", "size"),
            start_date=("date", "min"),
            end_date=("date", "max"),
            mean_absolute_error=("absolute_error", "mean"),
            direction_accuracy=("correct_direction", "mean"),
            mean_predicted_next_return=("predicted_next_return", "mean"),
            mean_realized_next_return=("target_next_return", "mean"),
        )
        .sort_values("pair")
    )
    metrics["start_date"] = pd.to_datetime(metrics["start_date"]).dt.date.astype(str)
    metrics["end_date"] = pd.to_datetime(metrics["end_date"]).dt.date.astype(str)
    return metrics.reset_index(drop=True)


def generate_scenario_frame(config: AppConfig) -> pd.DataFrame:
    """Apply configured FX shocks to recommended residual unhedged exposure."""

    recommendations = _load_or_generate_recommendations(config)
    rows: list[dict] = []
    for recommendation in recommendations.to_dict(orient="records"):
        residual_amount = float(recommendation["exposure_amount"]) - float(
            recommendation["suggested_hedge_amount"]
        )
        for shock in config.risk.scenario_shocks:
            rows.append(
                {
                    "exposure_id": recommendation["exposure_id"],
                    "exposure_currency": recommendation["exposure_currency"],
                    "base_currency": recommendation["base_currency"],
                    "shock_return": shock,
                    "residual_unhedged_amount": residual_amount,
                    "estimated_unhedged_pnl_base": residual_amount * shock,
                    "suggested_hedge_ratio": recommendation["suggested_hedge_ratio"],
                    "confidence_level": recommendation["confidence_level"],
                }
            )
    return pd.DataFrame(rows)


def generate_risk_summary_frame(config: AppConfig) -> pd.DataFrame:
    """Estimate parametric VaR and CVaR on residual unhedged exposure."""

    recommendations = _load_or_generate_recommendations(config)
    fx_rates = load_fx_rates(config.data.fx_rates_path)
    features = build_fx_features(
        fx_rates, target_horizon_days=config.model.target_horizon_days
    )
    latest_vol = (
        features.dropna(subset=["rolling_vol_20d"])
        .sort_values(["pair", "date"])
        .groupby("pair", as_index=False)
        .tail(1)
        .set_index("pair")["rolling_vol_20d"]
    )
    z_score = _normal_z_score(config.risk.var_confidence_level)
    rows = []
    for recommendation in recommendations.to_dict(orient="records"):
        residual_amount = float(recommendation["exposure_amount"]) - float(
            recommendation["suggested_hedge_amount"]
        )
        pair = recommendation["fx_pair_used"]
        volatility = float(latest_vol.get(pair, recommendation["rolling_20d_volatility"]))
        var_amount = abs(residual_amount) * volatility * z_score
        cvar_amount = abs(residual_amount) * volatility * (z_score + 0.35)
        rows.append(
            {
                "exposure_id": recommendation["exposure_id"],
                "fx_pair": pair,
                "residual_unhedged_amount": residual_amount,
                "volatility_used": volatility,
                "var_confidence_level": config.risk.var_confidence_level,
                "estimated_var_base": var_amount,
                "estimated_cvar_base": cvar_amount,
                "risk_note": (
                    "Parametric residual-risk estimate for decision support; "
                    "validate against treasury risk methodology."
                ),
            }
        )
    return pd.DataFrame(rows)


def _load_model_bundle(config: AppConfig) -> dict:
    if not config.model.model_path.exists():
        raise FileNotFoundError(
            f"Trained model not found at {config.model.model_path}. Run train first."
        )
    return joblib.load(config.model.model_path)


def _load_or_generate_recommendations(config: AppConfig) -> pd.DataFrame:
    if config.recommendation.recommendation_path.exists():
        return pd.read_csv(config.recommendation.recommendation_path)
    from currency_hedge_llm.hedge_recommender import generate_recommendations

    generate_recommendations(config)
    return pd.read_csv(config.recommendation.recommendation_path)


def _filter_backtest_window(scored: pd.DataFrame, backtest_years: int) -> pd.DataFrame:
    if backtest_years < 1:
        raise ValueError("risk.backtest_years must be at least 1")
    max_date = scored["date"].max()
    start_date = max_date - pd.DateOffset(years=backtest_years)
    filtered = scored[scored["date"] >= start_date].copy()
    if filtered.empty:
        raise ValueError(
            f"No scored FX rows are available inside the last {backtest_years} years."
        )
    return filtered


def _normal_z_score(confidence_level: float) -> float:
    lookup = {
        0.90: 1.2816,
        0.95: 1.6449,
        0.975: 1.9600,
        0.99: 2.3263,
    }
    return lookup.get(round(confidence_level, 3), 1.6449)
