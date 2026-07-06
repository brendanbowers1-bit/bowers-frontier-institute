"""Validation checks for generated hedge workflow artifacts."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from currency_hedge_llm.config import AppConfig


@dataclass(frozen=True)
class ValidationResult:
    """Summary of validation checks."""

    passed_checks: int
    warning_count: int
    warnings: list[str]


def validate_outputs(config: AppConfig) -> ValidationResult:
    """Validate generated reports and raise if a required quality gate fails."""

    failures: list[str] = []
    warnings: list[str] = []

    _require_file(config.model.model_path, failures)
    _require_file(config.recommendation.netted_exposures_path, failures)
    _require_file(config.recommendation.recommendation_path, failures)
    _require_file(config.risk.backtest_path, failures)
    _require_file(config.risk.scenario_path, failures)
    _require_file(config.risk.risk_summary_path, failures)
    _require_file(config.memo.memo_path, failures)

    if not failures:
        recommendations = pd.read_csv(config.recommendation.recommendation_path)
        netted = pd.read_csv(config.recommendation.netted_exposures_path)
        backtest = pd.read_csv(config.risk.backtest_path)
        scenario = pd.read_csv(config.risk.scenario_path)
        risk_summary = pd.read_csv(config.risk.risk_summary_path)
        memo_text = config.memo.memo_path.read_text(encoding="utf-8")

        validate_recommendation_frame(recommendations, failures, warnings)
        validate_netted_frame(netted, failures, warnings)
        validate_backtest_frame(backtest, failures, warnings)
        validate_scenario_frame(scenario, config, failures, warnings)
        validate_risk_summary_frame(risk_summary, failures, warnings)
        validate_memo_text(memo_text, failures)

    if failures:
        failure_text = "\n- ".join(failures)
        raise ValueError(f"Workflow validation failed:\n- {failure_text}")

    return ValidationResult(
        passed_checks=7,
        warning_count=len(warnings),
        warnings=warnings,
    )


def validate_recommendation_frame(
    recommendations: pd.DataFrame, failures: list[str], warnings: list[str]
) -> None:
    """Validate recommendation output invariants."""

    required_columns = {
        "exposure_id",
        "suggested_hedge_ratio",
        "policy_min_ratio",
        "policy_max_ratio",
        "suggested_hedge_amount",
        "confidence_level",
        "decision_support_warning",
        "recommended_next_step",
        "review_flags",
    }
    _require_columns(
        recommendations,
        required_columns,
        "recommendations",
        failures,
    )
    if not required_columns.issubset(recommendations.columns):
        return
    if recommendations.empty:
        failures.append("recommendations report is empty")
        return

    ratio_outside_policy = ~recommendations["suggested_hedge_ratio"].between(
        recommendations["policy_min_ratio"],
        recommendations["policy_max_ratio"],
        inclusive="both",
    )
    if ratio_outside_policy.any():
        failures.append("at least one hedge ratio is outside policy bounds")

    confidence_outside_bounds = ~recommendations["confidence_level"].between(
        0.0, 1.0, inclusive="both"
    )
    if confidence_outside_bounds.any():
        failures.append("at least one confidence score is outside 0-1 bounds")

    warning_missing = ~recommendations["decision_support_warning"].str.contains(
        "Decision support only", na=False
    )
    if warning_missing.any():
        failures.append("recommendation warning text is missing decision-support language")

    if (recommendations["review_flags"].fillna("none") != "none").any():
        warnings.append("one or more recommendations require Treasury review flags")


def validate_netted_frame(
    netted: pd.DataFrame, failures: list[str], warnings: list[str]
) -> None:
    """Validate netted exposure output."""

    required_columns = {
        "net_amount",
        "gross_abs_amount",
        "netting_benefit_amount",
        "policy_conflict",
    }
    _require_columns(
        netted,
        required_columns,
        "netted exposures",
        failures,
    )
    if not required_columns.issubset(netted.columns):
        return
    if netted.empty:
        failures.append("netted exposures report is empty")
        return
    if (netted["gross_abs_amount"] < netted["net_amount"].abs()).any():
        failures.append("gross exposure is smaller than absolute net exposure")
    if (netted["netting_benefit_amount"] < 0).any():
        failures.append("netting benefit cannot be negative")
    if netted["policy_conflict"].astype(bool).any():
        warnings.append("one or more netting buckets have policy conflicts")


def validate_backtest_frame(
    backtest: pd.DataFrame, failures: list[str], warnings: list[str]
) -> None:
    """Validate backtest output."""

    required_columns = {"target_next_return", "predicted_next_return", "absolute_error"}
    _require_columns(
        backtest,
        required_columns,
        "backtest",
        failures,
    )
    if not required_columns.issubset(backtest.columns):
        return
    if backtest.empty:
        failures.append("backtest report is empty")
        return
    if backtest["absolute_error"].isna().any():
        failures.append("backtest contains missing absolute errors")
    if backtest["absolute_error"].mean() > 0.05:
        warnings.append("average backtest absolute error is unusually high")


def validate_scenario_frame(
    scenario: pd.DataFrame,
    config: AppConfig,
    failures: list[str],
    warnings: list[str],
) -> None:
    """Validate scenario analysis output."""

    required_columns = {"exposure_id", "shock_return", "estimated_unhedged_pnl_base"}
    _require_columns(
        scenario,
        required_columns,
        "scenario analysis",
        failures,
    )
    if not required_columns.issubset(scenario.columns):
        return
    if scenario.empty:
        failures.append("scenario analysis report is empty")
        return
    configured_shocks = {float(shock) for shock in config.risk.scenario_shocks}
    observed_shocks = {float(shock) for shock in scenario["shock_return"].unique()}
    if observed_shocks != configured_shocks:
        failures.append("scenario shocks do not match configured shocks")
    if scenario["estimated_unhedged_pnl_base"].isna().any():
        failures.append("scenario analysis contains missing P&L values")


def validate_risk_summary_frame(
    risk_summary: pd.DataFrame, failures: list[str], warnings: list[str]
) -> None:
    """Validate residual risk summary output."""

    required_columns = {"estimated_var_base", "estimated_cvar_base", "risk_note"}
    _require_columns(
        risk_summary,
        required_columns,
        "risk summary",
        failures,
    )
    if not required_columns.issubset(risk_summary.columns):
        return
    if risk_summary.empty:
        failures.append("risk summary report is empty")
        return
    if (risk_summary["estimated_var_base"] < 0).any():
        failures.append("estimated VaR cannot be negative")
    if (risk_summary["estimated_cvar_base"] < risk_summary["estimated_var_base"]).any():
        failures.append("estimated CVaR should be at least as large as estimated VaR")


def validate_memo_text(memo_text: str, failures: list[str]) -> None:
    """Validate memo safety and review language."""

    required_phrases = [
        "Decision Support Warning",
        "must be reviewed by Treasury",
        "hedges must not be auto-executed",
        "LLM output is explanatory text only",
    ]
    for phrase in required_phrases:
        if phrase not in memo_text:
            failures.append(f"memo is missing required phrase: {phrase}")


def _require_file(path: Path, failures: list[str]) -> None:
    if not path.exists():
        failures.append(f"required artifact does not exist: {path}")
    elif path.is_file() and path.stat().st_size == 0:
        failures.append(f"required artifact is empty: {path}")


def _require_columns(
    frame: pd.DataFrame,
    required_columns: set[str],
    label: str,
    failures: list[str],
) -> None:
    missing = sorted(required_columns.difference(frame.columns))
    if missing:
        failures.append(f"{label} missing required columns: {missing}")
