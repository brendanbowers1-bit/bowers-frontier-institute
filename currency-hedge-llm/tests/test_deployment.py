from __future__ import annotations

from currency_hedge_llm.deployment import (
    DeploymentReadinessResult,
    ReadinessCheck,
    format_readiness_report,
)


def test_format_readiness_report_includes_score_and_failed_check() -> None:
    result = DeploymentReadinessResult(
        score=95,
        threshold=95,
        passed=True,
        checks=[
            ReadinessCheck(
                name="container_image",
                points=10,
                passed=True,
                detail="Dockerfile",
            ),
            ReadinessCheck(
                name="ci_workflow",
                points=10,
                passed=False,
                detail="Missing",
            ),
        ],
    )

    report = format_readiness_report(result)

    assert "Deployment readiness score: 95/100" in report
    assert "Status: PASS" in report
    assert "FAIL ci_workflow" in report
