"""CSV data loading and validation helpers."""

from __future__ import annotations

from pathlib import Path

import pandas as pd


FX_REQUIRED_COLUMNS = {"date", "pair", "spot"}
FORWARD_CURVE_REQUIRED_COLUMNS = {"date", "pair", "tenor_days", "forward_points"}
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
OPTIONAL_EXPOSURE_DEFAULTS = {
    "hedge_program": "unassigned",
    "accounting_designation": "undesignated",
    "liquidity_bucket": "standard",
    "counterparty_limit": pd.NA,
    "minimum_trade_size": pd.NA,
    "approval_status": "draft",
    "reviewer": "unassigned",
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
    for column, default in OPTIONAL_EXPOSURE_DEFAULTS.items():
        if column not in frame.columns:
            frame[column] = default
    frame["date"] = pd.to_datetime(frame["date"])
    frame["currency"] = frame["currency"].str.upper()
    frame["base_currency"] = frame["base_currency"].str.upper()
    for column in [
        "hedge_policy_min_ratio",
        "hedge_policy_max_ratio",
        "amount",
        "tenor_days",
        "counterparty_limit",
        "minimum_trade_size",
    ]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame.sort_values(["date", "exposure_id"]).reset_index(drop=True)


def load_forward_curve(path: str | Path | None) -> pd.DataFrame:
    """Load optional tenor-specific forward curve data from CSV."""

    if path is None:
        return pd.DataFrame()
    path = Path(path)
    if not path.exists():
        return pd.DataFrame()

    frame = pd.read_csv(path)
    _require_columns(frame, FORWARD_CURVE_REQUIRED_COLUMNS, "forward curve")
    frame["date"] = pd.to_datetime(frame["date"])
    frame["pair"] = frame["pair"].str.upper()
    frame["tenor_days"] = pd.to_numeric(frame["tenor_days"], errors="coerce")
    frame["forward_points"] = pd.to_numeric(frame["forward_points"], errors="coerce")
    if "implied_forward_rate" in frame.columns:
        frame["implied_forward_rate"] = pd.to_numeric(
            frame["implied_forward_rate"], errors="coerce"
        )
    return frame.sort_values(["pair", "date", "tenor_days"]).reset_index(drop=True)


def _require_columns(frame: pd.DataFrame, required: set[str], label: str) -> None:
    missing = sorted(required.difference(frame.columns))
    if missing:
        raise ValueError(f"{label} data is missing required columns: {missing}")
