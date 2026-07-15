from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from currency_hedge_llm.approval import initialize_approval_workflow
from currency_hedge_llm.config import load_config
from currency_hedge_llm.dashboard import generate_dashboard
from currency_hedge_llm.exposure_netting import generate_netted_exposures
from currency_hedge_llm.hedge_recommender import generate_recommendations
from currency_hedge_llm.ingestion import run_ingestion
from currency_hedge_llm.memo_writer import write_memo
from currency_hedge_llm.risk_reports import generate_risk_reports
from currency_hedge_llm.train_model import train_model
from currency_hedge_llm.validation import validate_outputs


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _write_full_config(tmp_path: Path) -> Path:
    config_path = tmp_path / "expanded-workflow.yaml"
    config_path.write_text(
        f"""
data:
  fx_rates_path: {PROJECT_ROOT / "data/raw/sample_fx_rates.csv"}
  exposures_path: {PROJECT_ROOT / "data/raw/sample_exposures.csv"}
  forward_curve_path: {PROJECT_ROOT / "data/raw/sample_forward_curve.csv"}
  processed_features_path: data/processed/fx_features.csv

ingestion:
  normalized_fx_rates_path: data/processed/normalized_fx_rates.csv
  normalized_forward_curve_path: data/processed/normalized_forward_curve.csv
  normalized_exposures_path: data/processed/normalized_exposures.csv

model:
  model_path: models/hedge_model.joblib
  n_estimators: 20
  random_state: 42
  target_horizon_days: 1

recommendation:
  recommendation_path: reports/hedge_recommendations.csv
  netted_exposures_path: reports/netted_exposures.csv
  adverse_forecast_threshold: 0.0015
  low_confidence_threshold: 0.35
  max_ratio_adjustment: 0.15
  default_minimum_trade_size: 250000
  approval_confidence_threshold: 0.50
  max_unhedged_amount_warning: 5000000

risk:
  backtest_path: reports/model_backtest.csv
  scenario_path: reports/scenario_analysis.csv
  risk_summary_path: reports/risk_summary.csv
  var_confidence_level: 0.95
  scenario_shocks:
    - -0.05
    - -0.025
    - 0.025
    - 0.05

memo:
  memo_path: reports/hedge_memo.md
  next_review_days: 30

dashboard:
  dashboard_path: reports/dashboard.html

approval:
  approval_status_path: reports/approval_status.csv
  audit_log_path: reports/approval_audit_log.csv

llm:
  provider: none
""",
        encoding="utf-8",
    )
    return config_path


def test_expanded_workflow_validation_passes_in_temp_workspace(tmp_path: Path) -> None:
    config = load_config(_write_full_config(tmp_path))

    run_ingestion(config)
    train_model(config)
    generate_netted_exposures(config)
    generate_recommendations(config)
    generate_risk_reports(config)
    initialize_approval_workflow(config)
    write_memo(config, llm_provider="none")
    generate_dashboard(config)
    result = validate_outputs(config)

    assert result.passed_checks == 9
    assert result.warning_count >= 0
    assert config.dashboard.dashboard_path.is_file()


def test_validate_cli_exits_nonzero_when_artifacts_are_missing(tmp_path: Path) -> None:
    config_path = _write_full_config(tmp_path)

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "currency_hedge_llm.cli",
            "validate",
            "--config",
            str(config_path),
        ],
        cwd=PROJECT_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 1
    assert "Workflow validation failed" in result.stderr
