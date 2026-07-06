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
    adverse_forecast_threshold: float = 0.0015
    low_confidence_threshold: float = 0.35
    max_ratio_adjustment: float = 0.15


class MemoConfig(BaseModel):
    """Memo writing settings."""

    memo_path: Path = Path("reports/hedge_memo.md")
    next_review_days: int = 30


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
    model: ModelConfig = Field(default_factory=ModelConfig)
    recommendation: RecommendationConfig = Field(default_factory=RecommendationConfig)
    memo: MemoConfig = Field(default_factory=MemoConfig)
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
    config.data.processed_features_path = _resolve_path(
        project_root, config.data.processed_features_path
    )
    config.model.model_path = _resolve_path(project_root, config.model.model_path)
    config.recommendation.recommendation_path = _resolve_path(
        project_root, config.recommendation.recommendation_path
    )
    config.memo.memo_path = _resolve_path(project_root, config.memo.memo_path)
    return config


def _infer_project_root(config_path: Path) -> Path:
    if config_path.parent.name == "config":
        return config_path.parent.parent
    return config_path.parent


def _resolve_path(project_root: Path, path: Path) -> Path:
    return path if path.is_absolute() else project_root / path
