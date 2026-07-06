from __future__ import annotations

import pandas as pd

from currency_hedge_llm.features import available_feature_columns, build_fx_features


def test_build_fx_features_includes_required_and_optional_columns() -> None:
    frame = pd.DataFrame(
        {
            "date": pd.date_range("2025-01-01", periods=30, freq="D"),
            "pair": ["EURUSD"] * 30,
            "spot": [1.10 + i * 0.001 for i in range(30)],
            "domestic_rate": [0.045] * 30,
            "foreign_rate": [0.032] * 30,
            "forward_points": [11.5 + i * 0.01 for i in range(30)],
        }
    )

    features = build_fx_features(frame)
    feature_columns = available_feature_columns(features)

    assert "fx_return" in features.columns
    assert "rolling_vol_5d" in features.columns
    assert "rolling_vol_20d" in features.columns
    assert "ma_signal" in features.columns
    assert "interest_rate_differential" in features.columns
    assert "forward_points_signal" in features.columns
    assert "target_next_return" in features.columns
    assert set(feature_columns) == {
        "fx_return",
        "rolling_vol_5d",
        "rolling_vol_20d",
        "ma_signal",
        "interest_rate_differential",
        "forward_points_signal",
    }
    assert features["target_next_return"].notna().sum() > 0
