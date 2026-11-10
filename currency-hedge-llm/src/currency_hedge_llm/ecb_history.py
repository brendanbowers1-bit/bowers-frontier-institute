"""Build a versioned USD-major FX history from public ECB euro reference rates.

ECB publishes daily euro foreign-exchange reference rates (units of currency
per one euro). EURUSD is the ECB USD reference. Other USD majors in this
dataset are derived crosses, not official ECB USD quotes.

Attribution: Source: ECB statistics.
Paper/research use only. This module does not place trades.
"""

from __future__ import annotations

import hashlib
import io
import json
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

import pandas as pd


ECB_HIST_ZIP_URL = "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip"
ECB_ATTRIBUTION = "Source: ECB statistics"
DATASET_ID = "ecb_usd_majors_v1"
USER_AGENT = "bowers-frontier-institute-research/1.0 (paper-only ECB FX history builder)"

# Conventional USD majors. Values are pandas expressions over EUR-based columns.
USD_MAJOR_SPECS = {
    "EURUSD": {"kind": "ecb_eur_reference", "formula": "USD"},
    "USDJPY": {"kind": "derived_usd_cross", "formula": "JPY / USD"},
    "GBPUSD": {"kind": "derived_usd_cross", "formula": "USD / GBP"},
    "AUDUSD": {"kind": "derived_usd_cross", "formula": "USD / AUD"},
    "NZDUSD": {"kind": "derived_usd_cross", "formula": "USD / NZD"},
    "USDCAD": {"kind": "derived_usd_cross", "formula": "CAD / USD"},
    "USDCHF": {"kind": "derived_usd_cross", "formula": "CHF / USD"},
}


@dataclass(frozen=True)
class HistoryBuildResult:
    """Paths and coverage summary for a built ECB history."""

    csv_path: str
    manifest_path: str
    dataset_id: str
    pair_universe: list[str]
    row_count: int
    date_start: str
    date_end: str
    source_sha256: str
    output_sha256: str


def build_ecb_usd_major_history(
    output_dir: str | Path,
    *,
    source_zip_path: str | Path | None = None,
    source_url: str = ECB_HIST_ZIP_URL,
    timeout_seconds: int = 60,
) -> HistoryBuildResult:
    """Download or read ECB history, derive USD majors, validate gaps, and write files."""

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_bytes, retrieved_at, resolved_source = _load_source_zip(
        source_zip_path=source_zip_path,
        source_url=source_url,
        timeout_seconds=timeout_seconds,
    )
    source_sha256 = hashlib.sha256(zip_bytes).hexdigest()
    wide = parse_ecb_eurofxref_csv(extract_ecb_history_csv(zip_bytes))
    history, gap_report = derive_usd_major_history(wide)

    csv_path = output_dir / f"{DATASET_ID}.csv"
    manifest_path = output_dir / f"{DATASET_ID}.manifest.json"
    history.to_csv(csv_path, index=False)
    output_sha256 = hashlib.sha256(csv_path.read_bytes()).hexdigest()

    pair_coverage = (
        history.groupby("pair", as_index=False)
        .agg(
            rows=("date", "size"),
            date_start=("date", "min"),
            date_end=("date", "max"),
        )
        .sort_values("pair")
    )
    pair_coverage["date_start"] = pd.to_datetime(pair_coverage["date_start"]).dt.date.astype(
        str
    )
    pair_coverage["date_end"] = pd.to_datetime(pair_coverage["date_end"]).dt.date.astype(str)

    date_start = history["date"].min().date().isoformat()
    date_end = history["date"].max().date().isoformat()
    pair_universe = sorted(history["pair"].unique())
    manifest = {
        "dataset_id": DATASET_ID,
        "attribution": ECB_ATTRIBUTION,
        "paper_research_only": True,
        "no_trade_execution": True,
        "source_name": "ECB euro foreign exchange reference rates",
        "source_url": source_url,
        "source_resolved": resolved_source,
        "retrieved_at_utc": retrieved_at,
        "source_sha256": source_sha256,
        "output_csv": csv_path.name,
        "output_sha256": output_sha256,
        "quote_convention": (
            "ECB publishes EUR-based reference rates (units of currency per EUR). "
            "EURUSD is the ECB USD reference. Other pairs are derived USD crosses "
            "and are not official ECB USD quotes."
        ),
        "pair_specs": USD_MAJOR_SPECS,
        "pair_universe": pair_universe,
        "pair_coverage": pair_coverage.to_dict(orient="records"),
        "row_count": int(len(history)),
        "date_start": date_start,
        "date_end": date_end,
        "calendar_note": (
            "Publication calendar is ECB TARGET business days, not a US market "
            "calendar. Gap validation treats weekends as expected closures and "
            "reports missing weekdays as holiday-or-unpublished days. Missing "
            "days are not interpolated."
        ),
        "gap_report": gap_report,
    }
    manifest_path.write_text(
        json.dumps(manifest, indent=2, sort_keys=False) + "\n", encoding="utf-8"
    )
    return HistoryBuildResult(
        csv_path=str(csv_path),
        manifest_path=str(manifest_path),
        dataset_id=DATASET_ID,
        pair_universe=pair_universe,
        row_count=int(len(history)),
        date_start=date_start,
        date_end=date_end,
        source_sha256=source_sha256,
        output_sha256=output_sha256,
    )


def extract_ecb_history_csv(zip_bytes: bytes) -> bytes:
    """Return the eurofxref-hist.csv payload from the ECB zip archive."""

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        names = archive.namelist()
        csv_names = [name for name in names if name.lower().endswith(".csv")]
        if not csv_names:
            raise ValueError(f"ECB zip did not contain a CSV file: {names}")
        return archive.read(csv_names[0])


def parse_ecb_eurofxref_csv(csv_bytes: bytes) -> pd.DataFrame:
    """Parse the ECB wide eurofxref history into a date-indexed quote frame."""

    frame = pd.read_csv(io.BytesIO(csv_bytes))
    if "Date" not in frame.columns:
        raise ValueError("ECB history CSV is missing the Date column.")
    frame = frame.rename(columns={"Date": "date"})
    frame["date"] = pd.to_datetime(frame["date"], errors="coerce")
    frame = frame.dropna(subset=["date"])
    quote_columns = [column for column in frame.columns if column != "date"]
    for column in quote_columns:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame.sort_values("date").reset_index(drop=True)


def derive_usd_major_history(wide: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Derive USD-major spots and a weekday gap report from EUR-based quotes."""

    required = {"date", "USD", "JPY", "GBP", "AUD", "NZD", "CAD", "CHF"}
    missing = sorted(required.difference(wide.columns))
    if missing:
        raise ValueError(f"ECB history is missing required quote columns: {missing}")

    derived = pd.DataFrame({"date": wide["date"]})
    derived["EURUSD"] = wide["USD"]
    derived["USDJPY"] = wide["JPY"] / wide["USD"]
    derived["GBPUSD"] = wide["USD"] / wide["GBP"]
    derived["AUDUSD"] = wide["USD"] / wide["AUD"]
    derived["NZDUSD"] = wide["USD"] / wide["NZD"]
    derived["USDCAD"] = wide["CAD"] / wide["USD"]
    derived["USDCHF"] = wide["CHF"] / wide["USD"]

    long_frames: list[pd.DataFrame] = []
    for pair, spec in USD_MAJOR_SPECS.items():
        pair_frame = derived[["date", pair]].rename(columns={pair: "spot"}).copy()
        pair_frame = pair_frame.dropna(subset=["spot"])
        pair_frame = pair_frame[pair_frame["spot"] > 0]
        pair_frame["pair"] = pair
        pair_frame["spot_origin"] = spec["kind"]
        pair_frame["source"] = ECB_ATTRIBUTION
        long_frames.append(pair_frame)

    history = pd.concat(long_frames, ignore_index=True)
    history = history.sort_values(["pair", "date"]).reset_index(drop=True)
    history["date"] = pd.to_datetime(history["date"])
    gap_report = validate_publication_gaps(history)
    return history[["date", "pair", "spot", "spot_origin", "source"]], gap_report


def validate_publication_gaps(history: pd.DataFrame) -> dict:
    """Describe weekend-aware gaps without filling unpublished ECB days."""

    if history.empty:
        raise ValueError("Cannot validate gaps for an empty FX history.")

    pair_reports: list[dict] = []
    for pair, pair_frame in history.groupby("pair", sort=True):
        dates = pd.DatetimeIndex(pd.to_datetime(pair_frame["date"])).normalize().unique()
        dates = dates.sort_values()
        start = dates.min()
        end = dates.max()
        expected_weekdays = pd.bdate_range(start, end, freq="B")
        missing_weekdays = expected_weekdays.difference(dates)
        calendar_gaps = dates.to_series().diff().dt.days.dropna()
        longest_gap = int(calendar_gaps.max()) if not calendar_gaps.empty else 0
        pair_reports.append(
            {
                "pair": pair,
                "observations": int(len(dates)),
                "date_start": start.date().isoformat(),
                "date_end": end.date().isoformat(),
                "expected_weekdays": int(len(expected_weekdays)),
                "missing_weekdays": int(len(missing_weekdays)),
                "missing_weekday_share": round(
                    float(len(missing_weekdays) / max(len(expected_weekdays), 1)), 6
                ),
                "longest_calendar_gap_days": longest_gap,
                "weekend_gaps_expected": True,
                "interpolation": "none",
            }
        )

    missing_counts = [item["missing_weekdays"] for item in pair_reports]
    return {
        "pairs": pair_reports,
        "max_missing_weekdays": max(missing_counts) if missing_counts else 0,
        "max_longest_calendar_gap_days": max(
            item["longest_calendar_gap_days"] for item in pair_reports
        )
        if pair_reports
        else 0,
        "holiday_note": (
            "Missing weekdays are consistent with ECB TARGET holidays and other "
            "non-publication days. They are recorded, not filled."
        ),
    }


def _load_source_zip(
    *,
    source_zip_path: str | Path | None,
    source_url: str,
    timeout_seconds: int,
) -> tuple[bytes, str, str]:
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    if source_zip_path is not None:
        path = Path(source_zip_path)
        return path.read_bytes(), retrieved_at, str(path)
    request = Request(source_url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=timeout_seconds) as response:  # noqa: S310
        payload = response.read()
    return payload, retrieved_at, source_url
