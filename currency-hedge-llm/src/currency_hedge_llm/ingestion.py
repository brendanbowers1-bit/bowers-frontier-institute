"""Source ingestion workflow for normalized treasury data files."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from currency_hedge_llm.config import AppConfig
from currency_hedge_llm.connectors.bloomberg import (
    normalize_forward_curve_export,
    normalize_fx_export,
)
from currency_hedge_llm.connectors.snowflake import normalize_exposure_export
from currency_hedge_llm.data_loader import load_exposures, load_forward_curve, load_fx_rates


@dataclass(frozen=True)
class IngestionResult:
    """Summary of source ingestion outputs."""

    fx_rows: int
    forward_curve_rows: int
    exposure_rows: int
    normalized_fx_rates_path: str
    normalized_forward_curve_path: str
    normalized_exposures_path: str


def run_ingestion(config: AppConfig) -> IngestionResult:
    """Normalize configured source exports into canonical CSV files."""

    fx_rates = _load_source_fx_rates(config)
    forward_curve = _load_source_forward_curve(config)
    exposures = _load_source_exposures(config)

    config.ingestion.normalized_fx_rates_path.parent.mkdir(parents=True, exist_ok=True)
    config.ingestion.normalized_forward_curve_path.parent.mkdir(
        parents=True, exist_ok=True
    )
    config.ingestion.normalized_exposures_path.parent.mkdir(parents=True, exist_ok=True)

    fx_rates.to_csv(config.ingestion.normalized_fx_rates_path, index=False)
    forward_curve.to_csv(config.ingestion.normalized_forward_curve_path, index=False)
    exposures.to_csv(config.ingestion.normalized_exposures_path, index=False)

    return IngestionResult(
        fx_rows=len(fx_rates),
        forward_curve_rows=len(forward_curve),
        exposure_rows=len(exposures),
        normalized_fx_rates_path=str(config.ingestion.normalized_fx_rates_path),
        normalized_forward_curve_path=str(
            config.ingestion.normalized_forward_curve_path
        ),
        normalized_exposures_path=str(config.ingestion.normalized_exposures_path),
    )


def _load_source_fx_rates(config: AppConfig) -> pd.DataFrame:
    if config.ingestion.bloomberg_fx_export_path is not None:
        return normalize_fx_export(config.ingestion.bloomberg_fx_export_path)
    return load_fx_rates(config.data.fx_rates_path)


def _load_source_forward_curve(config: AppConfig) -> pd.DataFrame:
    if config.ingestion.bloomberg_forward_curve_export_path is not None:
        return normalize_forward_curve_export(
            config.ingestion.bloomberg_forward_curve_export_path
        )
    return load_forward_curve(config.data.forward_curve_path)


def _load_source_exposures(config: AppConfig) -> pd.DataFrame:
    if config.ingestion.snowflake_exposures_export_path is not None:
        return normalize_exposure_export(config.ingestion.snowflake_exposures_export_path)
    return load_exposures(config.data.exposures_path)
