from __future__ import annotations

import pandas as pd

from currency_hedge_llm.risk_reports import (
    _filter_backtest_window,
    _normal_z_score,
    generate_pair_backtest_metrics,
)


def test_normal_z_score_uses_common_confidence_levels() -> None:
    assert _normal_z_score(0.90) == 1.2816
    assert _normal_z_score(0.95) == 1.6449
    assert _normal_z_score(0.99) == 2.3263
    assert _normal_z_score(0.93) == 1.6449


def test_filter_backtest_window_keeps_configured_year_span() -> None:
    scored = pd.DataFrame(
        {
            "date": pd.to_datetime(["2000-01-01", "2006-01-01", "2026-01-01"]),
            "pair": ["EURUSD", "EURUSD", "EURUSD"],
        }
    )

    filtered = _filter_backtest_window(scored, backtest_years=20)

    assert filtered["date"].min() == pd.Timestamp("2006-01-01")
    assert filtered["date"].max() == pd.Timestamp("2026-01-01")


def test_generate_pair_backtest_metrics_summarizes_each_currency_pair() -> None:
    backtest = pd.DataFrame(
        {
            "date": pd.to_datetime(
                ["2025-01-01", "2025-01-02", "2025-01-01", "2025-01-02"]
            ),
            "pair": ["EURUSD", "EURUSD", "USDJPY", "USDJPY"],
            "absolute_error": [0.01, 0.03, 0.02, 0.04],
            "correct_direction": [True, False, True, True],
            "predicted_next_return": [0.01, -0.01, 0.02, 0.03],
            "target_next_return": [0.02, 0.02, 0.01, 0.01],
        }
    )

    metrics = generate_pair_backtest_metrics(backtest)

    assert metrics["pair"].tolist() == ["EURUSD", "USDJPY"]
    assert metrics["rows"].tolist() == [2, 2]
    assert metrics.set_index("pair").loc["EURUSD", "mean_absolute_error"] == 0.02
    assert metrics.set_index("pair").loc["USDJPY", "direction_accuracy"] == 1.0
