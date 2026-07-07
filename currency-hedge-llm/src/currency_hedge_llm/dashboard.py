"""Static HTML dashboard generation for hedge workflow reports."""

from __future__ import annotations

from dataclasses import dataclass
from html import escape

import pandas as pd

from currency_hedge_llm.config import AppConfig


@dataclass(frozen=True)
class DashboardResult:
    """Summary of dashboard generation."""

    dashboard_path: str


def generate_dashboard(config: AppConfig) -> DashboardResult:
    """Generate a static HTML dashboard from workflow CSV outputs."""

    recommendations = _read_csv(config.recommendation.recommendation_path)
    netted = _read_csv(config.recommendation.netted_exposures_path)
    risk_summary = _read_csv(config.risk.risk_summary_path)
    approval = _read_csv(config.approval.approval_status_path)

    html = _render_dashboard(
        recommendations=recommendations,
        netted=netted,
        risk_summary=risk_summary,
        approval=approval,
    )
    config.dashboard.dashboard_path.parent.mkdir(parents=True, exist_ok=True)
    config.dashboard.dashboard_path.write_text(html, encoding="utf-8")
    return DashboardResult(dashboard_path=str(config.dashboard.dashboard_path))


def _read_csv(path) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def _render_dashboard(
    recommendations: pd.DataFrame,
    netted: pd.DataFrame,
    risk_summary: pd.DataFrame,
    approval: pd.DataFrame,
) -> str:
    total_exposure = _safe_abs_sum(recommendations, "exposure_amount")
    total_hedge = _safe_abs_sum(recommendations, "suggested_hedge_amount")
    total_residual = _safe_abs_sum(recommendations, "residual_unhedged_amount")
    total_var = _safe_sum(risk_summary, "estimated_var_base")
    flagged_count = _flagged_count(recommendations)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Currency Hedge LLM Dashboard</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 2rem; color: #172033; }}
    .warning {{ background: #fff3cd; border: 1px solid #ffe69c; padding: 1rem; }}
    .cards {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; }}
    .card {{ border: 1px solid #d8dee9; border-radius: 8px; padding: 1rem; }}
    .value {{ font-size: 1.4rem; font-weight: 700; margin-top: 0.5rem; }}
    table {{ border-collapse: collapse; width: 100%; margin: 1rem 0 2rem; }}
    th, td {{ border: 1px solid #d8dee9; padding: 0.5rem; text-align: left; }}
    th {{ background: #f4f6f8; }}
  </style>
</head>
<body>
  <h1>Currency Hedge Decision Support Dashboard</h1>
  <div class="warning">
    Decision support only. Treasury must review all outputs. This dashboard does not
    place trades, route orders, or authorize automatic hedge execution.
  </div>
  <div class="cards">
    {_card("Gross Exposure", total_exposure)}
    {_card("Suggested Hedge", total_hedge)}
    {_card("Residual Exposure", total_residual)}
    {_card("Estimated VaR", total_var)}
    {_card("Review Flags", flagged_count, numeric=True)}
  </div>
  <h2>Recommendations</h2>
  {_html_table(recommendations, ["exposure_id", "entity", "exposure_amount", "suggested_hedge_ratio", "suggested_hedge_amount", "residual_unhedged_amount", "review_flags"])}
  <h2>Netted Exposures</h2>
  {_html_table(netted, ["entity", "currency", "base_currency", "tenor_bucket", "net_amount", "gross_abs_amount", "netting_benefit_amount", "netting_recommendation"])}
  <h2>Residual Risk Summary</h2>
  {_html_table(risk_summary, ["exposure_id", "fx_pair", "residual_unhedged_amount", "estimated_var_base", "estimated_cvar_base"])}
  <h2>Approval Status</h2>
  {_html_table(approval, ["exposure_id", "approval_status", "reviewer", "review_flags", "no_auto_execution"])}
</body>
</html>
"""


def _card(label: str, value: float | int, numeric: bool = False) -> str:
    rendered = f"{value}" if numeric else f"{value:,.2f}"
    return (
        '<div class="card">'
        f"<div>{escape(label)}</div>"
        f'<div class="value">{escape(rendered)}</div>'
        "</div>"
    )


def _html_table(frame: pd.DataFrame, columns: list[str]) -> str:
    if frame.empty:
        return "<p>No data available.</p>"
    present_columns = [column for column in columns if column in frame.columns]
    if not present_columns:
        return "<p>No requested columns available.</p>"
    header = "".join(f"<th>{escape(column)}</th>" for column in present_columns)
    body_rows = []
    for record in frame[present_columns].to_dict(orient="records"):
        cells = "".join(
            f"<td>{escape(_format_cell(record[column]))}</td>" for column in present_columns
        )
        body_rows.append(f"<tr>{cells}</tr>")
    return f"<table><thead><tr>{header}</tr></thead><tbody>{''.join(body_rows)}</tbody></table>"


def _format_cell(value: object) -> str:
    if pd.isna(value):
        return ""
    if isinstance(value, float):
        return f"{value:,.4f}"
    return str(value)


def _safe_abs_sum(frame: pd.DataFrame, column: str) -> float:
    if frame.empty or column not in frame.columns:
        return 0.0
    return float(frame[column].abs().sum())


def _safe_sum(frame: pd.DataFrame, column: str) -> float:
    if frame.empty or column not in frame.columns:
        return 0.0
    return float(frame[column].sum())


def _flagged_count(recommendations: pd.DataFrame) -> int:
    if recommendations.empty or "review_flags" not in recommendations.columns:
        return 0
    return int((recommendations["review_flags"].fillna("none") != "none").sum())
