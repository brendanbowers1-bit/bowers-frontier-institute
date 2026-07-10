from __future__ import annotations

import pandas as pd

from currency_hedge_llm.approval import ALLOWED_STATUSES, _audit_row
from currency_hedge_llm.dashboard import _render_dashboard


def test_approval_audit_row_preserves_decision_support_flag() -> None:
    row = _audit_row(
        exposure_id="EXP-1",
        actor="Treasury",
        event="approval_status_changed",
        from_status="pending_treasury_review",
        to_status="changes_requested",
        comment="Need support.",
        timestamp="2026-01-01T00:00:00+00:00",
    )

    assert row["decision_support_only"] is True
    assert "approved_for_manual_treasury_action" in ALLOWED_STATUSES


def test_dashboard_contains_no_auto_execution_language() -> None:
    recommendations = pd.DataFrame(
        {
            "exposure_id": ["EXP-1"],
            "entity": ["Treasury"],
            "exposure_amount": [1_000_000.0],
            "suggested_hedge_ratio": [0.5],
            "suggested_hedge_amount": [500_000.0],
            "residual_unhedged_amount": [500_000.0],
            "review_flags": ["none"],
        }
    )

    html = _render_dashboard(
        recommendations=recommendations,
        netted=pd.DataFrame(),
        risk_summary=pd.DataFrame(),
        approval=pd.DataFrame(),
    )

    assert "Decision support only" in html
    assert "automatic hedge execution" in html
