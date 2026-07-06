"""Feature engineering for FX hedge model training."""

from __future__ import annotations

import pandas as pd


BASE_FEATURE_COLUMNS = [
    "fx_return",
    "rolling_vol_5d",
    "rolling_vol_20d",
    "ma_signal",
]
OPTIONAL_FEATURE_COLUMNS = [
    "interest_rate_differential",
    "forward_points_signal",
]


def build_fx_features(fx_rates: pd.DataFrame, target_horizon_days: int = 1) -> pd.DataFrame:
    """Build model features and next-period return target from FX rate history."""

    if target_horizon_days < 1:
        raise ValueError("target_horizon_days must be at least 1")

    required = {"date", "pair", "spot"}
    missing = sorted(required.difference(fx_rates.columns))
    if missing:
        raise ValueError(f"FX rates are missing required columns: {missing}")

    frames: list[pd.DataFrame] = []
    for _, pair_frame in fx_rates.sort_values(["pair", "date"]).groupby("pair", sort=False):
        pair_features = pair_frame.copy()
        pair_features["fx_return"] = pair_features["spot"].pct_change()
        pair_features["rolling_vol_5d"] = (
            pair_features["fx_return"].rolling(window=5, min_periods=5).std()
        )
        pair_features["rolling_vol_20d"] = (
            pair_features["fx_return"].rolling(window=20, min_periods=20).std()
        )
        pair_features["ma_5d"] = pair_features["spot"].rolling(window=5, min_periods=5).mean()
        pair_features["ma_20d"] = (
            pair_features["spot"].rolling(window=20, min_periods=20).mean()
        )
        pair_features["ma_signal"] = (
            pair_features["ma_5d"] / pair_features["ma_20d"] - 1.0
        )

        if {"domestic_rate", "foreign_rate"}.issubset(pair_features.columns):
            pair_features["interest_rate_differential"] = (
                pair_features["domestic_rate"] - pair_features["foreign_rate"]
            )

        if "forward_points" in pair_features.columns:
            pair_features["forward_points_signal"] = (
                pair_features["forward_points"] / pair_features["spot"]
            )

        pair_features["target_next_return"] = pair_features["fx_return"].shift(
            -target_horizon_days
        )
        frames.append(pair_features)

    return pd.concat(frames, ignore_index=True)


def available_feature_columns(features: pd.DataFrame) -> list[str]:
    """Return feature columns present in a feature frame."""

    columns = BASE_FEATURE_COLUMNS + OPTIONAL_FEATURE_COLUMNS
    return [column for column in columns if column in features.columns]
