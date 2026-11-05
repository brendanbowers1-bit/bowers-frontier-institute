from __future__ import annotations

import zipfile
from pathlib import Path

import pandas as pd

from currency_hedge_llm.ecb_history import (
    ECB_ATTRIBUTION,
    derive_usd_major_history,
    parse_ecb_eurofxref_csv,
    build_ecb_usd_major_history,
)


def _wide_csv() -> str:
    return """Date,USD,JPY,GBP,AUD,NZD,CAD,CHF
1999-01-04,1.1800,133.00,0.7100,1.9100,2.2200,1.8000,1.6100
1999-01-05,1.1850,134.00,0.7120,1.9000,2.2100,1.8100,1.6000
1999-01-06,1.1700,132.00,0.7050,1.9200,2.2300,1.7900,1.6200
1999-01-08,1.1750,133.50,0.7080,1.9150,2.2250,1.8050,1.6150
"""


def test_derive_usd_majors_and_flag_missing_weekday() -> None:
    wide = parse_ecb_eurofxref_csv(_wide_csv().encode("utf-8"))
    history, gap_report = derive_usd_major_history(wide)

    assert set(history["pair"]) == {
        "AUDUSD",
        "EURUSD",
        "GBPUSD",
        "NZDUSD",
        "USDCAD",
        "USDCHF",
        "USDJPY",
    }
    first = history[(history["pair"] == "EURUSD") & (history["date"] == "1999-01-04")].iloc[0]
    assert first["spot"] == 1.18
    assert first["spot_origin"] == "ecb_eur_reference"
    assert first["source"] == ECB_ATTRIBUTION

    usd_jpy = history[
        (history["pair"] == "USDJPY") & (history["date"] == "1999-01-04")
    ].iloc[0]
    assert abs(usd_jpy["spot"] - (133.00 / 1.1800)) < 1e-12
    assert usd_jpy["spot_origin"] == "derived_usd_cross"

    eurusd_gaps = next(item for item in gap_report["pairs"] if item["pair"] == "EURUSD")
    assert eurusd_gaps["missing_weekdays"] == 1
    assert eurusd_gaps["interpolation"] == "none"


def test_build_ecb_history_from_local_zip(tmp_path: Path) -> None:
    zip_path = tmp_path / "eurofxref-hist.zip"
    with zipfile.ZipFile(zip_path, "w") as archive:
        archive.writestr("eurofxref-hist.csv", _wide_csv())

    result = build_ecb_usd_major_history(tmp_path / "out", source_zip_path=zip_path)
    history = pd.read_csv(result.csv_path)
    manifest = (tmp_path / "out" / "ecb_usd_majors_v1.manifest.json").read_text(
        encoding="utf-8"
    )

    assert result.row_count == len(history)
    assert result.date_start == "1999-01-04"
    assert "Source: ECB statistics" in manifest
    assert '"paper_research_only": true' in manifest
    assert Path(result.manifest_path).is_file()


def test_committed_ecb_history_covers_usd_majors_from_1999() -> None:
    root = Path(__file__).resolve().parents[1]
    history_path = root / "data/research/ecb_usd_majors_v1.csv"
    manifest_path = root / "data/research/ecb_usd_majors_v1.manifest.json"
    if not history_path.is_file():
        return

    history = pd.read_csv(history_path, parse_dates=["date"])
    manifest = manifest_path.read_text(encoding="utf-8")
    assert history["date"].min().date().isoformat() == "1999-01-04"
    assert set(history["pair"]) == {
        "AUDUSD",
        "EURUSD",
        "GBPUSD",
        "NZDUSD",
        "USDCAD",
        "USDCHF",
        "USDJPY",
    }
    assert "Source: ECB statistics" in manifest
    assert history["source"].eq("Source: ECB statistics").all()
