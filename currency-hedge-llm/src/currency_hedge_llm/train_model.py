"""Model training for the baseline currency hedge forecaster."""

from __future__ import annotations

from dataclasses import dataclass

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.data_loader import load_fx_rates
from currency_hedge_llm.features import available_feature_columns, build_fx_features


@dataclass(frozen=True)
class TrainingResult:
    """Summary of a completed model training run."""

    model_path: str
    rows_used: int
    feature_columns: list[str]
    holdout_mae: float
    holdout_r2: float
    pair_count: int
    pair_universe: list[str]
    training_start_date: str
    training_end_date: str


def train_model(config: AppConfig) -> TrainingResult:
    """Train a RandomForestRegressor on FX features and save it to disk."""

    fx_rates = load_fx_rates(config.data.fx_rates_path)
    features = build_fx_features(
        fx_rates, target_horizon_days=config.model.target_horizon_days
    )
    feature_columns = available_feature_columns(features)
    if not feature_columns:
        raise ValueError("No usable feature columns were created.")

    training_frame = features.dropna(subset=feature_columns + ["target_next_return"])
    if len(training_frame) < 30:
        raise ValueError(
            "Not enough training rows after feature engineering; provide more FX history."
        )
    pair_universe = sorted(training_frame["pair"].unique())
    training_start_date = training_frame["date"].min().date().isoformat()
    training_end_date = training_frame["date"].max().date().isoformat()

    x = training_frame[feature_columns]
    y = training_frame["target_next_return"]
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        shuffle=False,
    )

    model = RandomForestRegressor(
        n_estimators=config.model.n_estimators,
        random_state=config.model.random_state,
        min_samples_leaf=3,
    )
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    holdout_mae = float(mean_absolute_error(y_test, predictions))
    holdout_r2 = _safe_r2(y_test, predictions)

    config.model.model_path.parent.mkdir(parents=True, exist_ok=True)
    config.data.processed_features_path.parent.mkdir(parents=True, exist_ok=True)
    features.to_csv(config.data.processed_features_path, index=False)
    joblib.dump(
        {
            "model": model,
            "feature_columns": feature_columns,
            "training_summary": {
                "rows_used": int(len(training_frame)),
                "holdout_mae": holdout_mae,
                "holdout_r2": holdout_r2,
                "target_horizon_days": config.model.target_horizon_days,
                "pair_count": len(pair_universe),
                "pair_universe": pair_universe,
                "training_start_date": training_start_date,
                "training_end_date": training_end_date,
            },
        },
        config.model.model_path,
    )

    return TrainingResult(
        model_path=str(config.model.model_path),
        rows_used=int(len(training_frame)),
        feature_columns=feature_columns,
        holdout_mae=holdout_mae,
        holdout_r2=holdout_r2,
        pair_count=len(pair_universe),
        pair_universe=pair_universe,
        training_start_date=training_start_date,
        training_end_date=training_end_date,
    )


def _safe_r2(y_true: pd.Series, y_pred: pd.Series) -> float:
    if len(y_true) < 2:
        return 0.0
    return float(r2_score(y_true, y_pred))
