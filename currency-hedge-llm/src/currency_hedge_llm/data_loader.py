"""CSV data loading and validation helpers."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


FX_REQUIRED_COLUMNS = {"date", "pair", "spot"}
EXPOSURE_REQUIRED_COLUMNS = {
    "exposure_id",
    "date",
    "entity",
    "currency",
    "base_currency",
    "amount",
    "hedge_policy_min_ratio",
    "hedge_policy_max_ratio",
    "tenor_days",
}


def load_fx_rates(path: str | Path) -> pd.DataFrame:
    """Load FX spot, rates, and forward-point data from CSV."""

    frame = pd.read_csv(path)
    _require_columns(frame, FX_REQUIRED_COLUMNS, "FX rates")
    frame["date"] = pd.to_datetime(frame["date"])
    frame["pair"] = frame["pair"].str.upper()
    return frame.sort_values(["pair", "date"]).reset_index(drop=True)


def load_exposures(path: str | Path) -> pd.DataFrame:
    """Load exposure data from CSV."""

    frame = pd.read_csv(path)
    _require_columns(frame, EXPOSURE_REQUIRED_COLUMNS, "exposures")
    frame["date"] = pd.to_datetime(frame["date"])
    frame["currency"] = frame["currency"].str.upper()
    frame["base_currency"] = frame["base_currency"].str.upper()
    return frame.sort_values(["date", "exposure_id"]).reset_index(drop=True)


def _require_columns(frame: pd.DataFrame, required: set[str], label: str) -> None:
    missing = sorted(required.difference(frame.columns))
    if missing:
        raise ValueError(f"{label} data is missing required columns: {missing}")
