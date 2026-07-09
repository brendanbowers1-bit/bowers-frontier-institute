from __future__ import annotations

from pathlib import Path

from currency_hedge_llm.config import load_config
from currency_hedge_llm.doctor import format_doctor_report, run_doctor
from currency_hedge_llm.train_model import train_model


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _write_config(tmp_path: Path) -> Path:
    config_path = tmp_path / "doctor-config.yaml"
    config_path.write_text(
        f"""
data:
  fx_rates_path: {PROJECT_ROOT / "data/raw/sample_fx_rates.csv"}
  exposures_path: {PROJECT_ROOT / "data/raw/sample_exposures.csv"}
  processed_features_path: data/processed/fx_features.csv

model:
  model_path: models/hedge_model.joblib
  n_estimators: 20
  random_state: 42
  target_horizon_days: 1

recommendation:
  recommendation_path: reports/hedge_recommendations.csv

memo:
  memo_path: reports/hedge_memo.md

llm:
  provider: none
""",
        encoding="utf-8",
    )
    return config_path


def test_doctor_can_create_and_validate_runtime_output_dirs(tmp_path: Path) -> None:
    config = load_config(_write_config(tmp_path))

    result = run_doctor(config, create_output_dirs=True)

    assert result.passed
    assert config.data.processed_features_path.parent.is_dir()
    assert config.model.model_path.parent.is_dir()
    assert config.recommendation.recommendation_path.parent.is_dir()
    assert config.memo.memo_path.parent.is_dir()
    assert "Overall: PASS" in format_doctor_report(result)


def test_doctor_can_require_model_after_training(tmp_path: Path) -> None:
    config = load_config(_write_config(tmp_path))

    missing_model_result = run_doctor(
        config, require_model=True, create_output_dirs=True
    )
    train_model(config)
    trained_model_result = run_doctor(config, require_model=True)

    assert not missing_model_result.passed
    assert trained_model_result.passed
