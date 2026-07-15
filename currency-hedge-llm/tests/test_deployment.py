from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from currency_hedge_llm.config import load_config
from currency_hedge_llm.deployment import (
    DeploymentReadinessResult,
    ReadinessCheck,
    assess_deployment_readiness,
    format_readiness_report,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]


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


def test_assess_deployment_readiness_meets_threshold_in_repo() -> None:
    config = load_config(PROJECT_ROOT / "config/config.example.yaml")

    result = assess_deployment_readiness(config, threshold=95)
    failed = [check for check in result.checks if not check.passed]

    assert result.score >= 95
    assert result.passed
    assert failed == []


def test_deployment_readiness_cli_exits_zero_in_repo() -> None:
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "currency_hedge_llm.cli",
            "deployment-readiness",
            "--config",
            str(PROJECT_ROOT / "config/config.example.yaml"),
            "--threshold",
            "95",
        ],
        cwd=PROJECT_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0
    assert "Status: PASS" in result.stdout
