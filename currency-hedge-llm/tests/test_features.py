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
    assert "pair_EURUSD" in features.columns
    assert "target_next_return" in features.columns
    assert set(feature_columns) == {
        "fx_return",
        "rolling_vol_5d",
        "rolling_vol_20d",
        "ma_signal",
        "interest_rate_differential",
        "forward_points_signal",
        "pair_EURUSD",
    }
    assert features["target_next_return"].notna().sum() > 0


def test_build_fx_features_adds_pair_identity_for_each_currency_pair() -> None:
    frame = pd.DataFrame(
        {
            "date": list(pd.date_range("2025-01-01", periods=30, freq="D")) * 2,
            "pair": ["EURUSD"] * 30 + ["USDJPY"] * 30,
            "spot": [1.10 + i * 0.001 for i in range(30)]
            + [150.00 + i * 0.05 for i in range(30)],
        }
    )

    features = build_fx_features(frame)
    feature_columns = available_feature_columns(features)

    assert {"pair_EURUSD", "pair_USDJPY"}.issubset(feature_columns)
    latest_by_pair = features.sort_values(["pair", "date"]).groupby("pair").tail(1)
    identity = latest_by_pair.set_index("pair")[["pair_EURUSD", "pair_USDJPY"]]
    assert identity.loc["EURUSD"].to_dict() == {"pair_EURUSD": 1.0, "pair_USDJPY": 0.0}
    assert identity.loc["USDJPY"].to_dict() == {"pair_EURUSD": 0.0, "pair_USDJPY": 1.0}
