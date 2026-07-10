"""Exposure netting utilities for treasury review."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.data_loader import load_exposures


@dataclass(frozen=True)
class NettingResult:
    """Summary of an exposure netting run."""

    netted_exposures_path: str
    rows_written: int


def generate_netted_exposures(config: AppConfig) -> NettingResult:
    """Net exposures by entity, currency, tenor bucket, program, and designation."""

    exposures = load_exposures(config.data.exposures_path)
    netted = net_exposures(exposures)
    config.recommendation.netted_exposures_path.parent.mkdir(parents=True, exist_ok=True)
    netted.to_csv(config.recommendation.netted_exposures_path, index=False)
    return NettingResult(
        netted_exposures_path=str(config.recommendation.netted_exposures_path),
        rows_written=len(netted),
    )


def net_exposures(exposures: pd.DataFrame) -> pd.DataFrame:
    """Return a netted exposure report with conservative policy intersections."""

    frame = exposures.copy()
    frame["tenor_bucket"] = frame["tenor_days"].apply(tenor_bucket)
    group_columns = [
        "entity",
        "currency",
        "base_currency",
        "tenor_bucket",
        "hedge_program",
        "accounting_designation",
    ]

    grouped = (
        frame.groupby(group_columns, dropna=False)
        .agg(
            net_amount=("amount", "sum"),
            gross_abs_amount=("amount", lambda values: values.abs().sum()),
            exposure_count=("exposure_id", "count"),
            earliest_exposure_date=("date", "min"),
            weighted_avg_tenor_days=("tenor_days", _weighted_average_tenor),
            policy_min_ratio=("hedge_policy_min_ratio", "max"),
            policy_max_ratio=("hedge_policy_max_ratio", "min"),
            max_counterparty_limit=("counterparty_limit", "max"),
            minimum_trade_size=("minimum_trade_size", "max"),
        )
        .reset_index()
    )
    grouped["netting_benefit_amount"] = (
        grouped["gross_abs_amount"] - grouped["net_amount"].abs()
    )
    grouped["policy_conflict"] = (
        grouped["policy_min_ratio"] > grouped["policy_max_ratio"]
    )
    grouped["netting_recommendation"] = grouped.apply(_netting_recommendation, axis=1)
    return grouped.sort_values(group_columns).reset_index(drop=True)


def tenor_bucket(tenor_days: float) -> str:
    """Map tenor days into practical treasury buckets."""

    if tenor_days <= 30:
        return "0-30d"
    if tenor_days <= 90:
        return "31-90d"
    if tenor_days <= 180:
        return "91-180d"
    if tenor_days <= 365:
        return "181-365d"
    return "365d+"


def _weighted_average_tenor(tenors: pd.Series) -> float:
    return float(tenors.mean())


def _netting_recommendation(row: pd.Series) -> str:
    if row["policy_conflict"]:
        return "Review policy conflict before recommending a hedge."
    if abs(row["net_amount"]) < row["minimum_trade_size"]:
        return "Net exposure is below minimum trade size; monitor or aggregate."
    if row["netting_benefit_amount"] > 0:
        return "Use net amount for hedge sizing after Treasury approval."
    return "No offsetting exposure in this bucket; review gross exposure directly."
