from __future__ import annotations

from currency_hedge_llm.hedge_recommender import (
    calculate_confidence,
    clamp,
    is_adverse_forecast,
)


def test_clamp_keeps_ratio_inside_policy_bounds() -> None:
    assert clamp(0.95, 0.40, 0.80) == 0.80
    assert clamp(0.10, 0.40, 0.80) == 0.40
    assert clamp(0.60, 0.40, 0.80) == 0.60


def test_adverse_forecast_respects_signed_exposure() -> None:
    assert is_adverse_forecast(amount=1_000_000, model_forecast=-0.002)
    assert not is_adverse_forecast(amount=1_000_000, model_forecast=0.002)
    assert is_adverse_forecast(amount=-1_000_000, model_forecast=0.002)
    assert not is_adverse_forecast(amount=-1_000_000, model_forecast=-0.002)


def test_confidence_score_is_bounded() -> None:
    assert 0.0 <= calculate_confidence(0.001, 0.004) <= 1.0
    assert calculate_confidence(0.001, 0.0) == 0.1
    assert calculate_confidence(0.02, 0.001) == 1.0
