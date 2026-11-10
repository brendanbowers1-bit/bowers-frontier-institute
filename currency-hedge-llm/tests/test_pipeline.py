from __future__ import annotations

from pathlib import Path

from currency_hedge_llm.config import load_config
from currency_hedge_llm.hedge_recommender import generate_recommendations
from currency_hedge_llm.memo_writer import DECISION_SUPPORT_WARNING, write_memo
from currency_hedge_llm.train_model import train_model


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_train_recommend_and_memo_pipeline_uses_temp_outputs(tmp_path: Path) -> None:
    config_path = tmp_path / "smoke-config.yaml"
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
  adverse_forecast_threshold: 0.0015
  low_confidence_threshold: 0.35
  max_ratio_adjustment: 0.15

memo:
  memo_path: reports/hedge_memo.md
  next_review_days: 30

llm:
  provider: none
""",
        encoding="utf-8",
    )
    config = load_config(config_path)

    training_result = train_model(config)
    recommendation_result = generate_recommendations(config)
    memo_result = write_memo(config, llm_provider="none")

    assert training_result.rows_used >= 30
    assert Path(training_result.model_path).is_file()
    assert config.data.processed_features_path.is_file()
    assert recommendation_result.rows_written > 0
    assert Path(recommendation_result.recommendation_path).is_file()
    assert Path(memo_result.memo_path).is_file()
    assert DECISION_SUPPORT_WARNING in Path(memo_result.memo_path).read_text(
        encoding="utf-8"
    )
