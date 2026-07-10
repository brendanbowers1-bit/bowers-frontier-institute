from __future__ import annotations

import pandas as pd

from currency_hedge_llm.exposure_netting import net_exposures, tenor_bucket


def test_tenor_bucket_maps_common_treasury_buckets() -> None:
    assert tenor_bucket(30) == "0-30d"
    assert tenor_bucket(90) == "31-90d"
    assert tenor_bucket(180) == "91-180d"
    assert tenor_bucket(365) == "181-365d"
    assert tenor_bucket(720) == "365d+"


def test_net_exposures_offsets_same_bucket_amounts() -> None:
    exposures = pd.DataFrame(
        {
            "exposure_id": ["A", "B"],
            "date": pd.to_datetime(["2025-01-01", "2025-01-01"]),
            "entity": ["Treasury", "Treasury"],
            "currency": ["EUR", "EUR"],
            "base_currency": ["USD", "USD"],
            "amount": [1_000_000.0, -250_000.0],
            "hedge_policy_min_ratio": [0.4, 0.5],
            "hedge_policy_max_ratio": [0.9, 0.8],
            "tenor_days": [60, 75],
            "hedge_program": ["cash_flow", "cash_flow"],
            "accounting_designation": ["undesignated", "undesignated"],
            "counterparty_limit": [5_000_000, 5_000_000],
            "minimum_trade_size": [100_000, 100_000],
        }
    )

    netted = net_exposures(exposures)

    assert len(netted) == 1
    assert netted.loc[0, "net_amount"] == 750_000
    assert netted.loc[0, "gross_abs_amount"] == 1_250_000
    assert netted.loc[0, "netting_benefit_amount"] == 500_000
    assert netted.loc[0, "policy_min_ratio"] == 0.5
    assert netted.loc[0, "policy_max_ratio"] == 0.8
