from __future__ import annotations

import pandas as pd

from currency_hedge_llm.connectors.bloomberg import normalize_fx_export
from currency_hedge_llm.connectors.snowflake import normalize_exposure_export


def test_bloomberg_fx_export_aliases_are_normalized(tmp_path) -> None:
    export_path = tmp_path / "bbg_fx.csv"
    pd.DataFrame(
        {
            "pricing_date": ["2025-01-01"],
            "currency_pair": ["eurusd"],
            "px_last": [1.10],
            "usd_rate": [0.045],
            "foreign_ccy_rate": [0.032],
            "fwd_points": [12.0],
        }
    ).to_csv(export_path, index=False)

    normalized = normalize_fx_export(export_path)

    assert list(normalized.columns) == [
        "date",
        "pair",
        "spot",
        "domestic_rate",
        "foreign_rate",
        "forward_points",
    ]
    assert normalized.loc[0, "pair"] == "EURUSD"
    assert normalized.loc[0, "spot"] == 1.10


def test_snowflake_exposure_export_aliases_are_normalized(tmp_path) -> None:
    export_path = tmp_path / "snowflake_exposures.csv"
    pd.DataFrame(
        {
            "cash_flow_id": ["CF-1"],
            "forecast_date": ["2025-01-01"],
            "legal_entity": ["Treasury"],
            "exposure_currency": ["eur"],
            "functional_currency": ["usd"],
            "signed_amount": [1_000_000],
            "policy_min": [0.4],
            "policy_max": [0.8],
            "days_to_maturity": [90],
        }
    ).to_csv(export_path, index=False)

    normalized = normalize_exposure_export(export_path)

    assert normalized.loc[0, "exposure_id"] == "CF-1"
    assert normalized.loc[0, "currency"] == "EUR"
    assert normalized.loc[0, "base_currency"] == "USD"
    assert normalized.loc[0, "hedge_program"] == "unassigned"
