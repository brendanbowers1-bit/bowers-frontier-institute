"""Configuration loading for the currency hedging workflow."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field


class DataConfig(BaseModel):
    """Input and intermediate data locations."""

    fx_rates_path: Path
    exposures_path: Path
    forward_curve_path: Path | None = Path("data/raw/sample_forward_curve.csv")
    processed_features_path: Path = Path("data/processed/fx_features.csv")


class ModelConfig(BaseModel):
    """Model training settings."""

    model_path: Path = Path("models/hedge_model.joblib")
    n_estimators: int = 200
    random_state: int = 42
    target_horizon_days: int = 1


class RecommendationConfig(BaseModel):
    """Policy and output settings for hedge recommendations."""

    recommendation_path: Path = Path("reports/hedge_recommendations.csv")
    netted_exposures_path: Path = Path("reports/netted_exposures.csv")
    adverse_forecast_threshold: float = 0.0015
    low_confidence_threshold: float = 0.35
    max_ratio_adjustment: float = 0.15
    default_minimum_trade_size: float = 250_000.0
    approval_confidence_threshold: float = 0.50
    max_unhedged_amount_warning: float = 5_000_000.0


class IngestionConfig(BaseModel):
    """Source export and normalized output settings."""

    bloomberg_fx_export_path: Path | None = None
    bloomberg_forward_curve_export_path: Path | None = None
    snowflake_exposures_export_path: Path | None = None
    normalized_fx_rates_path: Path = Path("data/processed/normalized_fx_rates.csv")
    normalized_forward_curve_path: Path = Path("data/processed/normalized_forward_curve.csv")
    normalized_exposures_path: Path = Path("data/processed/normalized_exposures.csv")


class RiskConfig(BaseModel):
    """Backtesting and scenario-risk report settings."""

    backtest_path: Path = Path("reports/model_backtest.csv")
    scenario_path: Path = Path("reports/scenario_analysis.csv")
    risk_summary_path: Path = Path("reports/risk_summary.csv")
    var_confidence_level: float = 0.95
    scenario_shocks: list[float] = Field(default_factory=lambda: [-0.05, -0.025, 0.025, 0.05])


class MemoConfig(BaseModel):
    """Memo writing settings."""

    memo_path: Path = Path("reports/hedge_memo.md")
    next_review_days: int = 30


class DashboardConfig(BaseModel):
    """Static dashboard output settings."""

    dashboard_path: Path = Path("reports/dashboard.html")


class ApprovalConfig(BaseModel):
    """Approval workflow output settings."""

    approval_status_path: Path = Path("reports/approval_status.csv")
    audit_log_path: Path = Path("reports/approval_audit_log.csv")


class LLMConfig(BaseModel):
    """LLM provider configuration."""

    provider: str = "none"
    local_model: str = "qwen2.5:7b-instruct"
    local_url: str = "http://localhost:11434/api/generate"
    openai_model: str = "gpt-4.1-mini"
    openai_url: str = "https://api.openai.com/v1/responses"
    temperature: float = 0.2


class AppConfig(BaseModel):
    """Complete application configuration."""

    data: DataConfig
    ingestion: IngestionConfig = Field(default_factory=IngestionConfig)
    model: ModelConfig = Field(default_factory=ModelConfig)
    recommendation: RecommendationConfig = Field(default_factory=RecommendationConfig)
    risk: RiskConfig = Field(default_factory=RiskConfig)
    memo: MemoConfig = Field(default_factory=MemoConfig)
    dashboard: DashboardConfig = Field(default_factory=DashboardConfig)
    approval: ApprovalConfig = Field(default_factory=ApprovalConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
    project_root: Path


def load_config(config_path: str | Path) -> AppConfig:
    """Load YAML configuration and resolve relative paths from the project root."""

    path = Path(config_path).expanduser().resolve()
    with path.open("r", encoding="utf-8") as file:
        raw_config: dict[str, Any] = yaml.safe_load(file) or {}

    project_root = _infer_project_root(path)
    raw_config["project_root"] = project_root
    config = AppConfig(**raw_config)
    config.data.fx_rates_path = _resolve_path(project_root, config.data.fx_rates_path)
    config.data.exposures_path = _resolve_path(project_root, config.data.exposures_path)
    config.data.forward_curve_path = _resolve_optional_path(
        project_root, config.data.forward_curve_path
    )
    config.data.processed_features_path = _resolve_path(
        project_root, config.data.processed_features_path
    )
    config.ingestion.bloomberg_fx_export_path = _resolve_optional_path(
        project_root, config.ingestion.bloomberg_fx_export_path
    )
    config.ingestion.bloomberg_forward_curve_export_path = _resolve_optional_path(
        project_root, config.ingestion.bloomberg_forward_curve_export_path
    )
    config.ingestion.snowflake_exposures_export_path = _resolve_optional_path(
        project_root, config.ingestion.snowflake_exposures_export_path
    )
    config.ingestion.normalized_fx_rates_path = _resolve_path(
        project_root, config.ingestion.normalized_fx_rates_path
    )
    config.ingestion.normalized_forward_curve_path = _resolve_path(
        project_root, config.ingestion.normalized_forward_curve_path
    )
    config.ingestion.normalized_exposures_path = _resolve_path(
        project_root, config.ingestion.normalized_exposures_path
    )
    config.model.model_path = _resolve_path(project_root, config.model.model_path)
    config.recommendation.recommendation_path = _resolve_path(
        project_root, config.recommendation.recommendation_path
    )
    config.recommendation.netted_exposures_path = _resolve_path(
        project_root, config.recommendation.netted_exposures_path
    )
    config.risk.backtest_path = _resolve_path(project_root, config.risk.backtest_path)
    config.risk.scenario_path = _resolve_path(project_root, config.risk.scenario_path)
    config.risk.risk_summary_path = _resolve_path(
        project_root, config.risk.risk_summary_path
    )
    config.memo.memo_path = _resolve_path(project_root, config.memo.memo_path)
    config.dashboard.dashboard_path = _resolve_path(
        project_root, config.dashboard.dashboard_path
    )
    config.approval.approval_status_path = _resolve_path(
        project_root, config.approval.approval_status_path
    )
    config.approval.audit_log_path = _resolve_path(project_root, config.approval.audit_log_path)
    return config


def _infer_project_root(config_path: Path) -> Path:
    if config_path.parent.name == "config":
        return config_path.parent.parent
    return config_path.parent


def _resolve_path(project_root: Path, path: Path) -> Path:
    return path if path.is_absolute() else project_root / path


def _resolve_optional_path(project_root: Path, path: Path | None) -> Path | None:
    if path is None:
        return None
    return _resolve_path(project_root, path)
