from __future__ import annotations

from pathlib import Path

import pandas as pd

from currency_hedge_llm.config import load_config
from currency_hedge_llm.walk_forward import run_walk_forward


def _write_history(path: Path) -> None:
    dates = pd.bdate_range("2018-01-02", "2021-12-31", freq="B")
    rows: list[dict] = []
    for offset, date in enumerate(dates):
        rows.append(
            {
                "date": date.date().isoformat(),
                "pair": "EURUSD",
                "spot": 1.10 + 0.0004 * offset,
            }
        )
        rows.append(
            {
                "date": date.date().isoformat(),
                "pair": "USDJPY",
                "spot": 110.0 + 0.02 * offset,
            }
        )
    pd.DataFrame(rows).to_csv(path, index=False)


def test_walk_forward_keeps_frozen_holdout_and_training_leak_free(tmp_path: Path) -> None:
    history_path = tmp_path / "fx.csv"
    _write_history(history_path)
    config_path = tmp_path / "walk.yaml"
    config_path.write_text(
        f"""
data:
  fx_rates_path: {history_path}
  exposures_path: {history_path}
  processed_features_path: features.csv

model:
  model_path: model.joblib
  n_estimators: 8
  random_state: 42
  target_horizon_days: 1

walk_forward:
  predictions_path: predictions.csv
  fold_metrics_path: folds.csv
  pair_metrics_path: pairs.csv
  summary_path: summary.json
  holdout_years: 1
  min_train_years: 1
  retrain_frequency_days: 252
  n_estimators: 8
""",
        encoding="utf-8",
    )

    result = run_walk_forward(load_config(config_path))
    predictions = pd.read_csv(result.predictions_path, parse_dates=["date"])
    summary = Path(result.summary_path).read_text(encoding="utf-8")

    assert {"EURUSD", "USDJPY"} <= set(result.pair_universe)
    assert (predictions["split"] == "frozen_holdout").any()
    assert (predictions["split"] == "walk_forward_oos").any()

    holdout = predictions[predictions["split"] == "frozen_holdout"]
    oos = predictions[predictions["split"] == "walk_forward_oos"]
    assert oos["date"].max() < holdout["date"].min()
    assert pd.to_datetime(holdout["train_end"]).max() <= holdout["date"].min()

    for _, fold in predictions.groupby("fold_id"):
        train_end = pd.to_datetime(fold["train_end"].iloc[0])
        assert fold["date"].min() >= train_end

    assert "frozen_holdout_excluded_from_training" in summary
    assert '"paper_research_only": true' in summary
    assert result.fold_count >= 2
