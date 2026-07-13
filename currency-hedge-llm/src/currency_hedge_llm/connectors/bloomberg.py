"""Bloomberg CSV export normalization helpers.

This module intentionally avoids a Bloomberg SDK dependency. In production, point
the config at controlled Bloomberg export files or replace these functions with
your approved BLPAPI/SAPI ingestion layer.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


FX_COLUMN_ALIASES = {
    "date": ["date", "as_of_date", "pricing_date"],
    "pair": ["pair", "currency_pair", "fx_pair", "ticker"],
    "spot": ["spot", "px_last", "last_price", "spot_rate"],
    "domestic_rate": ["domestic_rate", "usd_rate", "base_rate"],
    "foreign_rate": ["foreign_rate", "foreign_ccy_rate", "quote_rate"],
    "forward_points": ["forward_points", "fwd_points", "forward_pts"],
}
FORWARD_COLUMN_ALIASES = {
    "date": ["date", "as_of_date", "curve_date"],
    "pair": ["pair", "currency_pair", "fx_pair", "ticker"],
    "tenor_days": ["tenor_days", "days", "tenor_day_count"],
    "forward_points": ["forward_points", "fwd_points", "forward_pts"],
    "implied_forward_rate": ["implied_forward_rate", "outright", "forward_rate"],
}


def normalize_fx_export(path: str | Path) -> pd.DataFrame:
    """Normalize a Bloomberg-style FX/rates CSV export."""

    frame = pd.read_csv(path)
    normalized = _normalize_columns(frame, FX_COLUMN_ALIASES)
    normalized["date"] = pd.to_datetime(normalized["date"])
    normalized["pair"] = normalized["pair"].astype(str).str.upper().str.replace(" ", "")
    for column in ["spot", "domestic_rate", "foreign_rate", "forward_points"]:
        normalized[column] = pd.to_numeric(normalized[column], errors="coerce")
    return normalized[
        ["date", "pair", "spot", "domestic_rate", "foreign_rate", "forward_points"]
    ].dropna(subset=["date", "pair", "spot"])


def normalize_forward_curve_export(path: str | Path) -> pd.DataFrame:
    """Normalize a Bloomberg-style FX forward curve CSV export."""

    frame = pd.read_csv(path)
    normalized = _normalize_columns(frame, FORWARD_COLUMN_ALIASES)
    normalized["date"] = pd.to_datetime(normalized["date"])
    normalized["pair"] = normalized["pair"].astype(str).str.upper().str.replace(" ", "")
    normalized["tenor_days"] = pd.to_numeric(normalized["tenor_days"], errors="coerce")
    normalized["forward_points"] = pd.to_numeric(
        normalized["forward_points"], errors="coerce"
    )
    if "implied_forward_rate" not in normalized.columns:
        normalized["implied_forward_rate"] = pd.NA
    normalized["implied_forward_rate"] = pd.to_numeric(
        normalized["implied_forward_rate"], errors="coerce"
    )
    return normalized[
        ["date", "pair", "tenor_days", "forward_points", "implied_forward_rate"]
    ].dropna(subset=["date", "pair", "tenor_days", "forward_points"])


def _normalize_columns(frame: pd.DataFrame, aliases: dict[str, list[str]]) -> pd.DataFrame:
    lower_columns = {column.lower(): column for column in frame.columns}
    output = pd.DataFrame()
    missing: list[str] = []
    for canonical, candidates in aliases.items():
        source = next((lower_columns[name] for name in candidates if name in lower_columns), None)
        if source is None:
            missing.append(canonical)
        else:
            output[canonical] = frame[source]
    if missing:
        raise ValueError(f"Bloomberg export missing columns mappable to: {missing}")
    return output
