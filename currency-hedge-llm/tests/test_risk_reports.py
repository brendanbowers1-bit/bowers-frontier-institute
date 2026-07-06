from __future__ import annotations

from currency_hedge_llm.risk_reports import _normal_z_score


def test_normal_z_score_uses_common_confidence_levels() -> None:
    assert _normal_z_score(0.90) == 1.2816
    assert _normal_z_score(0.95) == 1.6449
    assert _normal_z_score(0.99) == 2.3263
    assert _normal_z_score(0.93) == 1.6449
