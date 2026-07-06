from __future__ import annotations

import pandas as pd

from currency_hedge_llm.validation import (
    validate_memo_text,
    validate_recommendation_frame,
)


def test_validate_recommendation_frame_flags_policy_breach() -> None:
    recommendations = pd.DataFrame(
        {
            "exposure_id": ["A"],
            "suggested_hedge_ratio": [0.95],
            "policy_min_ratio": [0.40],
            "policy_max_ratio": [0.80],
            "suggested_hedge_amount": [950_000.0],
            "confidence_level": [0.75],
            "decision_support_warning": [
                "Decision support only; Treasury must review before any hedge execution."
            ],
            "recommended_next_step": [
                "Ready for Treasury review within policy bounds; no auto-execution."
            ],
            "review_flags": ["none"],
        }
    )
    failures: list[str] = []
    warnings: list[str] = []

    validate_recommendation_frame(recommendations, failures, warnings)

    assert "at least one hedge ratio is outside policy bounds" in failures


def test_validate_memo_text_requires_safety_language() -> None:
    failures: list[str] = []

    validate_memo_text("plain memo", failures)

    assert failures
    assert any("Decision Support Warning" in failure for failure in failures)
