from __future__ import annotations

from pathlib import Path

from currency_hedge_llm.config import load_config


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_example_config_resolves_paths_from_project_root() -> None:
    config = load_config(PROJECT_ROOT / "config/config.example.yaml")

    assert config.project_root == PROJECT_ROOT
    assert config.data.fx_rates_path == PROJECT_ROOT / "data/raw/sample_fx_rates.csv"
    assert config.data.exposures_path == PROJECT_ROOT / "data/raw/sample_exposures.csv"
    assert config.model.model_path == PROJECT_ROOT / "models/hedge_model.joblib"
    assert (
        config.recommendation.recommendation_path
        == PROJECT_ROOT / "reports/hedge_recommendations.csv"
    )
