from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from currency_hedge_llm.config import load_config
from currency_hedge_llm.doctor import format_doctor_report, run_doctor
from currency_hedge_llm.hedge_recommender import generate_recommendations
from currency_hedge_llm.train_model import train_model


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _write_config(
    tmp_path: Path,
    *,
    fx_rates_path: Path | None = None,
    exposures_path: Path | None = None,
    provider: str = "none",
) -> Path:
    config_path = tmp_path / "doctor-config.yaml"
    fx_rates_path = fx_rates_path or PROJECT_ROOT / "data/raw/sample_fx_rates.csv"
    exposures_path = exposures_path or PROJECT_ROOT / "data/raw/sample_exposures.csv"
    config_path.write_text(
        f"""
data:
  fx_rates_path: {fx_rates_path}
  exposures_path: {exposures_path}
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
  provider: {provider}
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


def test_doctor_reports_invalid_fx_schema(tmp_path: Path) -> None:
    bad_fx_rates = tmp_path / "bad-fx.csv"
    bad_fx_rates.write_text("date,spot\n2026-01-01,1.10\n", encoding="utf-8")
    config = load_config(_write_config(tmp_path, fx_rates_path=bad_fx_rates))

    result = run_doctor(config, create_output_dirs=True)

    assert not result.passed
    assert any(
        check.name == "FX rates schema" and "missing required columns" in check.detail
        for check in result.checks
    )


def test_doctor_reports_unsupported_llm_provider(tmp_path: Path) -> None:
    config = load_config(_write_config(tmp_path, provider="unknown"))

    result = run_doctor(config, create_output_dirs=True)

    assert not result.passed
    assert any(
        check.name == "LLM provider" and "unsupported provider" in check.detail
        for check in result.checks
    )


def test_doctor_can_require_recommendations_after_generation(tmp_path: Path) -> None:
    config = load_config(_write_config(tmp_path))

    missing_recommendations_result = run_doctor(
        config, require_recommendations=True, create_output_dirs=True
    )
    train_model(config)
    generate_recommendations(config)
    recommendations_result = run_doctor(config, require_recommendations=True)

    assert not missing_recommendations_result.passed
    assert recommendations_result.passed


def test_doctor_cli_exits_nonzero_on_failure(tmp_path: Path) -> None:
    bad_fx_rates = tmp_path / "bad-fx.csv"
    bad_fx_rates.write_text("date,spot\n2026-01-01,1.10\n", encoding="utf-8")
    config_path = _write_config(tmp_path, fx_rates_path=bad_fx_rates)

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "currency_hedge_llm.cli",
            "doctor",
            "--config",
            str(config_path),
            "--create-output-dirs",
        ],
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert "Overall: FAIL" in result.stdout
