"""Snowflake exposure export normalization helpers.

This module expects a CSV export from a governed Snowflake query. It avoids a
runtime Snowflake connector dependency so the core demo remains lightweight.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd


EXPOSURE_COLUMN_ALIASES = {
    "exposure_id": ["exposure_id", "id", "cash_flow_id"],
    "date": ["date", "exposure_date", "forecast_date"],
    "entity": ["entity", "legal_entity", "business_unit"],
    "currency": ["currency", "exposure_currency", "ccy"],
    "base_currency": ["base_currency", "functional_currency", "base_ccy"],
    "amount": ["amount", "signed_amount", "exposure_amount"],
    "hedge_policy_min_ratio": ["hedge_policy_min_ratio", "policy_min", "min_ratio"],
    "hedge_policy_max_ratio": ["hedge_policy_max_ratio", "policy_max", "max_ratio"],
    "tenor_days": ["tenor_days", "days_to_maturity", "forecast_tenor_days"],
    "hedge_program": ["hedge_program", "program"],
    "accounting_designation": ["accounting_designation", "designation"],
    "liquidity_bucket": ["liquidity_bucket", "liquidity"],
    "counterparty_limit": ["counterparty_limit", "cp_limit"],
    "minimum_trade_size": ["minimum_trade_size", "min_trade_size"],
    "approval_status": ["approval_status", "status"],
    "reviewer": ["reviewer", "approver"],
}


def normalize_exposure_export(path: str | Path) -> pd.DataFrame:
    """Normalize a Snowflake-style exposure CSV export."""

    frame = pd.read_csv(path)
    normalized = _normalize_columns(frame, EXPOSURE_COLUMN_ALIASES)
    normalized["date"] = pd.to_datetime(normalized["date"])
    normalized["currency"] = normalized["currency"].astype(str).str.upper()
    normalized["base_currency"] = normalized["base_currency"].astype(str).str.upper()
    numeric_columns = [
        "amount",
        "hedge_policy_min_ratio",
        "hedge_policy_max_ratio",
        "tenor_days",
        "counterparty_limit",
        "minimum_trade_size",
    ]
    for column in numeric_columns:
        normalized[column] = pd.to_numeric(normalized[column], errors="coerce")
    return normalized.dropna(
        subset=[
            "exposure_id",
            "date",
            "entity",
            "currency",
            "base_currency",
            "amount",
            "hedge_policy_min_ratio",
            "hedge_policy_max_ratio",
            "tenor_days",
        ]
    )


def _normalize_columns(frame: pd.DataFrame, aliases: dict[str, list[str]]) -> pd.DataFrame:
    lower_columns = {column.lower(): column for column in frame.columns}
    output = pd.DataFrame()
    missing_required: list[str] = []
    for canonical, candidates in aliases.items():
        source = next((lower_columns[name] for name in candidates if name in lower_columns), None)
        if source is None:
            if canonical in {
                "exposure_id",
                "date",
                "entity",
                "currency",
                "base_currency",
                "amount",
                "hedge_policy_min_ratio",
                "hedge_policy_max_ratio",
                "tenor_days",
            }:
                missing_required.append(canonical)
            else:
                output[canonical] = _default_for_optional_column(canonical, len(frame))
        else:
            output[canonical] = frame[source]
    if missing_required:
        raise ValueError(
            f"Snowflake exposure export missing columns mappable to: {missing_required}"
        )
    return output


def _default_for_optional_column(column: str, row_count: int) -> list[object]:
    defaults = {
        "hedge_program": "unassigned",
        "accounting_designation": "undesignated",
        "liquidity_bucket": "standard",
        "counterparty_limit": pd.NA,
        "minimum_trade_size": pd.NA,
        "approval_status": "draft",
        "reviewer": "unassigned",
    }
    return [defaults[column]] * row_count
