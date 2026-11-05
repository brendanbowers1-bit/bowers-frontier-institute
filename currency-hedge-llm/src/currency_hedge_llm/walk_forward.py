"""Leakage-safe expanding-window walk-forward backtest with a frozen holdout.

Training rows always have dates strictly before the first test date of a fold.
The frozen holdout is never used for training or retrain-date selection.
Paper/research only. This module does not place trades.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.data_loader import load_fx_rates
from currency_hedge_llm.features import available_feature_columns, build_fx_features


@dataclass(frozen=True)
class WalkForwardResult:
    """Summary of a completed walk-forward research run."""

    predictions_path: str
    fold_metrics_path: str
    pair_metrics_path: str
    summary_path: str
    prediction_rows: int
    fold_count: int
    pair_universe: list[str]
    walk_forward_start: str
    walk_forward_end: str
    holdout_start: str
    holdout_end: str


def run_walk_forward(config: AppConfig) -> WalkForwardResult:
    """Train expanding-window models and score OOS plus frozen-holdout rows."""

    fx_rates = load_fx_rates(config.data.fx_rates_path)
    features = build_fx_features(
        fx_rates, target_horizon_days=config.model.target_horizon_days
    )
    feature_columns = available_feature_columns(features)
    if not feature_columns:
        raise ValueError("No usable feature columns were created.")

    scored = features.dropna(subset=feature_columns + ["target_next_return"]).copy()
    scored["date"] = pd.to_datetime(scored["date"])
    if scored.empty:
        raise ValueError("No scored rows remain after feature engineering.")

    unique_dates = pd.DatetimeIndex(sorted(scored["date"].unique()))
    holdout_start = _holdout_start_date(unique_dates, config.walk_forward.holdout_years)
    oos_dates = unique_dates[unique_dates < holdout_start]
    if len(oos_dates) == 0:
        raise ValueError("Frozen holdout leaves no dates for walk-forward training.")

    min_train_end = oos_dates.min() + pd.DateOffset(
        years=config.walk_forward.min_train_years
    )
    retrain_dates = _retrain_dates(
        oos_dates=oos_dates,
        min_train_end=min_train_end,
        frequency_days=config.walk_forward.retrain_frequency_days,
    )
    if not retrain_dates:
        raise ValueError(
            "Not enough history to form a walk-forward fold before the frozen holdout."
        )

    n_estimators = (
        config.walk_forward.n_estimators
        if config.walk_forward.n_estimators is not None
        else config.model.n_estimators
    )
    fold_frames: list[pd.DataFrame] = []
    fold_summaries: list[dict] = []

    for index, test_start in enumerate(retrain_dates):
        test_end = (
            retrain_dates[index + 1]
            if index + 1 < len(retrain_dates)
            else holdout_start
        )
        train = scored[scored["date"] < test_start]
        test = scored[(scored["date"] >= test_start) & (scored["date"] < test_end)]
        if len(train) < 30 or test.empty:
            continue
        _assert_no_leakage(train, test)
        fold = _score_fold(
            train=train,
            test=test,
            feature_columns=feature_columns,
            n_estimators=n_estimators,
            random_state=config.model.random_state,
            split="walk_forward_oos",
            fold_id=f"wf_{index + 1:02d}",
            train_end=test_start,
        )
        fold_frames.append(fold)
        fold_summaries.append(_fold_summary(fold, train_rows=len(train)))

    holdout = scored[scored["date"] >= holdout_start]
    holdout_train = scored[scored["date"] < holdout_start]
    if len(holdout_train) < 30 or holdout.empty:
        raise ValueError("Frozen holdout could not be scored with a pre-holdout model.")
    _assert_no_leakage(holdout_train, holdout)
    holdout_fold = _score_fold(
        train=holdout_train,
        test=holdout,
        feature_columns=feature_columns,
        n_estimators=n_estimators,
        random_state=config.model.random_state,
        split="frozen_holdout",
        fold_id="holdout",
        train_end=holdout_start,
    )
    fold_frames.append(holdout_fold)
    fold_summaries.append(_fold_summary(holdout_fold, train_rows=len(holdout_train)))

    predictions = pd.concat(fold_frames, ignore_index=True).sort_values(
        ["split", "date", "pair"]
    )
    split_pair_metrics = (
        predictions.groupby(["split", "pair"], as_index=False)
        .agg(
            rows=("pair", "size"),
            start_date=("date", "min"),
            end_date=("date", "max"),
            mean_absolute_error=("absolute_error", "mean"),
            direction_accuracy=("correct_direction", "mean"),
        )
        .sort_values(["split", "pair"])
    )
    split_pair_metrics["start_date"] = pd.to_datetime(
        split_pair_metrics["start_date"]
    ).dt.date.astype(str)
    split_pair_metrics["end_date"] = pd.to_datetime(
        split_pair_metrics["end_date"]
    ).dt.date.astype(str)

    oos = predictions[predictions["split"] == "walk_forward_oos"]
    holdout_pred = predictions[predictions["split"] == "frozen_holdout"]
    pair_universe = sorted(predictions["pair"].unique())
    summary = {
        "paper_research_only": True,
        "no_trade_execution": True,
        "leakage_controls": {
            "train_dates_strictly_before_test_start": True,
            "frozen_holdout_excluded_from_training": True,
            "features_use_backward_looking_windows_only": True,
            "labels_are_next_period_returns": True,
        },
        "model": {
            "type": "RandomForestRegressor",
            "n_estimators": n_estimators,
            "random_state": config.model.random_state,
            "min_samples_leaf": 3,
            "feature_columns": feature_columns,
        },
        "split": {
            "min_train_years": config.walk_forward.min_train_years,
            "retrain_frequency_days": config.walk_forward.retrain_frequency_days,
            "holdout_years": config.walk_forward.holdout_years,
            "walk_forward_start": _iso_date(oos["date"].min()) if not oos.empty else None,
            "walk_forward_end": _iso_date(oos["date"].max()) if not oos.empty else None,
            "holdout_start": _iso_date(holdout_pred["date"].min()),
            "holdout_end": _iso_date(holdout_pred["date"].max()),
            "fold_count": len(fold_summaries),
        },
        "pair_universe": pair_universe,
        "overall": {
            "walk_forward_oos": _split_metrics(oos),
            "frozen_holdout": _split_metrics(holdout_pred),
        },
        "folds": fold_summaries,
        "pair_metrics_by_split": split_pair_metrics.to_dict(orient="records"),
        "created_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "caveats": [
            "This is a paper/research forecast evaluation, not a trading record.",
            "Direction accuracy near 50% is expected for daily FX returns.",
            "Derived USD crosses inherit ECB euro-reference publication timing.",
            "The model does not include transaction costs, slippage, or execution.",
        ],
    }

    config.walk_forward.predictions_path.parent.mkdir(parents=True, exist_ok=True)
    config.walk_forward.fold_metrics_path.parent.mkdir(parents=True, exist_ok=True)
    config.walk_forward.pair_metrics_path.parent.mkdir(parents=True, exist_ok=True)
    config.walk_forward.summary_path.parent.mkdir(parents=True, exist_ok=True)
    predictions.to_csv(config.walk_forward.predictions_path, index=False)
    pd.DataFrame(fold_summaries).to_csv(config.walk_forward.fold_metrics_path, index=False)
    split_pair_metrics.to_csv(config.walk_forward.pair_metrics_path, index=False)
    config.walk_forward.summary_path.write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    return WalkForwardResult(
        predictions_path=str(config.walk_forward.predictions_path),
        fold_metrics_path=str(config.walk_forward.fold_metrics_path),
        pair_metrics_path=str(config.walk_forward.pair_metrics_path),
        summary_path=str(config.walk_forward.summary_path),
        prediction_rows=len(predictions),
        fold_count=len(fold_summaries),
        pair_universe=pair_universe,
        walk_forward_start=summary["split"]["walk_forward_start"] or "",
        walk_forward_end=summary["split"]["walk_forward_end"] or "",
        holdout_start=summary["split"]["holdout_start"],
        holdout_end=summary["split"]["holdout_end"],
    )


def _score_fold(
    *,
    train: pd.DataFrame,
    test: pd.DataFrame,
    feature_columns: list[str],
    n_estimators: int,
    random_state: int,
    split: str,
    fold_id: str,
    train_end: pd.Timestamp,
) -> pd.DataFrame:
    model = RandomForestRegressor(
        n_estimators=n_estimators,
        random_state=random_state,
        min_samples_leaf=3,
        n_jobs=1,
    )
    model.fit(train[feature_columns], train["target_next_return"])
    scored = test.copy()
    scored["predicted_next_return"] = model.predict(scored[feature_columns])
    scored["prediction_error"] = (
        scored["predicted_next_return"] - scored["target_next_return"]
    )
    scored["absolute_error"] = scored["prediction_error"].abs()
    scored["correct_direction"] = np.sign(scored["predicted_next_return"]) == np.sign(
        scored["target_next_return"]
    )
    scored["split"] = split
    scored["fold_id"] = fold_id
    scored["train_end"] = pd.Timestamp(train_end).date().isoformat()
    output_columns = [
        "date",
        "pair",
        "spot",
        "split",
        "fold_id",
        "train_end",
        "target_next_return",
        "predicted_next_return",
        "prediction_error",
        "absolute_error",
        "correct_direction",
        "rolling_vol_20d",
        "ma_signal",
    ]
    return scored[[column for column in output_columns if column in scored.columns]]


def _assert_no_leakage(train: pd.DataFrame, test: pd.DataFrame) -> None:
    if train.empty or test.empty:
        raise ValueError("Walk-forward folds must contain both train and test rows.")
    if train["date"].max() >= test["date"].min():
        raise ValueError("Walk-forward fold leaks: training dates overlap the test window.")


def _holdout_start_date(unique_dates: pd.DatetimeIndex, holdout_years: int) -> pd.Timestamp:
    if holdout_years < 1:
        raise ValueError("walk_forward.holdout_years must be at least 1")
    holdout_start = unique_dates.max() - pd.DateOffset(years=holdout_years)
    candidate = unique_dates[unique_dates >= holdout_start]
    if candidate.empty:
        raise ValueError("No dates fall inside the frozen holdout window.")
    return pd.Timestamp(candidate.min())


def _retrain_dates(
    *,
    oos_dates: pd.DatetimeIndex,
    min_train_end: pd.Timestamp,
    frequency_days: int,
) -> list[pd.Timestamp]:
    if frequency_days < 1:
        raise ValueError("walk_forward.retrain_frequency_days must be at least 1")
    eligible = oos_dates[oos_dates >= min_train_end]
    if eligible.empty:
        return []
    selected = [pd.Timestamp(eligible[0])]
    next_allowed = selected[0] + pd.Timedelta(days=frequency_days)
    for date in eligible[1:]:
        stamp = pd.Timestamp(date)
        if stamp >= next_allowed:
            selected.append(stamp)
            next_allowed = stamp + pd.Timedelta(days=frequency_days)
    return selected


def _fold_summary(fold: pd.DataFrame, *, train_rows: int) -> dict:
    return {
        "fold_id": str(fold["fold_id"].iloc[0]),
        "split": str(fold["split"].iloc[0]),
        "train_end": str(fold["train_end"].iloc[0]),
        "train_rows": int(train_rows),
        "test_rows": int(len(fold)),
        "test_start": _iso_date(fold["date"].min()),
        "test_end": _iso_date(fold["date"].max()),
        "pairs": int(fold["pair"].nunique()),
        "mean_absolute_error": float(fold["absolute_error"].mean()),
        "direction_accuracy": float(fold["correct_direction"].mean()),
        "holdout_r2": _safe_r2(fold["target_next_return"], fold["predicted_next_return"]),
    }


def _split_metrics(frame: pd.DataFrame) -> dict:
    if frame.empty:
        return {
            "rows": 0,
            "pairs": 0,
            "mean_absolute_error": None,
            "direction_accuracy": None,
            "r2": None,
        }
    return {
        "rows": int(len(frame)),
        "pairs": int(frame["pair"].nunique()),
        "mean_absolute_error": float(frame["absolute_error"].mean()),
        "direction_accuracy": float(frame["correct_direction"].mean()),
        "r2": _safe_r2(frame["target_next_return"], frame["predicted_next_return"]),
    }


def _iso_date(value: pd.Timestamp) -> str:
    return pd.Timestamp(value).date().isoformat()


def _safe_r2(y_true: pd.Series, y_pred: pd.Series) -> float:
    if len(y_true) < 2:
        return 0.0
    return float(r2_score(y_true, y_pred))
